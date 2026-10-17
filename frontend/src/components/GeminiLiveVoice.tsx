"use client";

import { useRef, useState } from "react";

type ChatLine = {
    role: "Bạn" | "Gemini";
    text: string;
};

interface GeminiLiveVoiceProps {
    conversationId?: string;
    customerId?: number;
}

const BACKEND_URL = "http://localhost:8080";

const SUPPORT_TOOLS = [{
    functionDeclarations: [{
        name: "searchCustomerSupport",
        description:
            "Tra cứu chính sách, FAQ và hướng dẫn hỗ trợ khách hàng trong kho tri thức VKU Support. Bắt buộc dùng trước khi trả lời câu hỏi về đổi trả, hoàn tiền, SLA, ticket hoặc quy trình hỗ trợ.",
        parameters: {
            type: "OBJECT",
            properties: {
                question: {
                    type: "STRING",
                    description: "Câu hỏi của khách hàng bằng ngôn ngữ tự nhiên.",
                },
            },
            required: ["question"],
        },
    }],
}];

const SUPPORT_SYSTEM_INSTRUCTION = `Bạn là trợ lý hỗ trợ khách hàng , trả lời bằng tiếng Việt tự nhiên. Với mọi câu hỏi về chính sách, FAQ, đổi trả/hoàn tiền, thời gian hỗ trợ, SLA hoặc trạng thái ticket, bắt buộc gọi công cụ searchCustomerSupport trước khi trả lời. Chỉ dựa vào kết quả công cụ, không tự bịa thông tin. Nếu kho tri thức không có câu trả lời hoặc kết quả yêu cầu hỗ trợ con người, hãy nói rõ và hướng khách hàng đến nhân viên hỗ trợ. Sau khi nhận kết quả công cụ, trả lời ngắn gọn, dễ hiểu và phù hợp để đọc thành tiếng.`;

function downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
    const ratio = inputRate / 16000;
    if (ratio < 1) throw new Error("Tần số âm thanh đầu vào không hợp lệ.");

    const outputLength = Math.floor(input.length / ratio);
    const output = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const start = Math.floor(i * ratio);
        const end = Math.min(Math.floor((i + 1) * ratio), input.length);
        let sum = 0, count = 0;
        for (let j = start; j < end; j++) {
            sum += input[j];
            count++;
        }
        const sample = count ? sum / count : 0;
        const clamped = Math.max(-1, Math.min(1, sample));
        output[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    return output;
}

function toBase64(samples: Int16Array): string {
    const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function pcm24kToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = Math.floor(bytes.byteLength / 2);
    const samples = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        samples[i] = view.getInt16(i * 2, true) / 32768;
    }
    return samples;
}

export default function GeminiLiveVoice({ conversationId, customerId = 1 }: GeminiLiveVoiceProps) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [status, setStatus] = useState("Chưa kết nối");
    const [messages, setMessages] = useState<ChatLine[]>([]);
    const [error, setError] = useState("");

    const socketRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextPlayTimeRef = useRef(0);

    // Cờ kiểm soát nối chuỗi từ liên tục cho cục bộ Gemini Live
    const isAiStreamingRef = useRef(false);
    const isUserStreamingRef = useRef(false);
    const currentAiTextRef = useRef("");
    const currentUserTextRef = useRef("");

    const stop = () => {
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        processorRef.current = null;
        sourceRef.current = null;

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        inputContextRef.current?.close().catch(() => {});
        outputContextRef.current?.close().catch(() => {});
        inputContextRef.current = null;
        outputContextRef.current = null;

        socketRef.current?.close();
        socketRef.current = null;

        setConnected(false);
        setConnecting(false);
        setStatus("Đã ngắt kết nối");
    };

    const start = async () => {
        if (connecting || connected) return;

        setError("");
        setConnecting(true);
        setStatus("Đang xin token...");

        try {
            const tokenResponse = await fetch(`${BACKEND_URL}/api/chat/gemini-token`, { method: "POST" });
            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok || !tokenData.name) {
                throw new Error(tokenData.error || "Backend không trả về token Gemini hợp lệ.");
            }

            const token = tokenData.name;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            streamRef.current = stream;

            setStatus("Đang kết nối Gemini Live...");
            const socket = new WebSocket(
                `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`
            );
            socketRef.current = socket;

            socket.onopen = async () => {
                try {
                    socket.send(
                        JSON.stringify({
                            setup: {
                                model: "models/gemini-3.1-flash-live-preview",
                                generationConfig: { responseModalities: ["AUDIO"] },
                                systemInstruction: { parts: [{ text: SUPPORT_SYSTEM_INSTRUCTION }] },
                                tools: SUPPORT_TOOLS,
                                inputAudioTranscription: {},
                                outputAudioTranscription: {},
                            },
                        })
                    );

                    const inputContext = new AudioContext();
                    const outputContext = new AudioContext();
                    inputContextRef.current = inputContext;
                    outputContextRef.current = outputContext;

                    await inputContext.resume();
                    await outputContext.resume();

                    const source = inputContext.createMediaStreamSource(stream);
                    const processor = inputContext.createScriptProcessor(4096, 1, 1);
                    sourceRef.current = source;
                    processorRef.current = processor;

                    processor.onaudioprocess = (event) => {
                        if (socket.readyState !== WebSocket.OPEN) return;
                        const input = event.inputBuffer.getChannelData(0);
                        const pcm = downsampleTo16k(input, inputContext.sampleRate);
                        const base64Audio = toBase64(pcm);

                        if (base64Audio.length === 0) return;

                        socket.send(
                            JSON.stringify({
                                realtimeInput: {
                                    audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" },
                                },
                            })
                        );
                    };

                    source.connect(processor);
                    const mute = inputContext.createGain();
                    mute.gain.value = 0;
                    processor.connect(mute);
                    mute.connect(inputContext.destination);

                    setStatus("Đang chờ Gemini xác nhận phiên...");
                } catch (e) {
                    setError(e instanceof Error ? e.message : "Không thể khởi tạo âm thanh.");
                    stop();
                }
            };

            socket.onmessage = async (event) => {
                try {
                    let rawData: string;
                    if (typeof event.data === "string") rawData = event.data;
                    else if (event.data instanceof Blob) rawData = await event.data.text();
                    else if (event.data instanceof ArrayBuffer) rawData = new TextDecoder().decode(event.data);
                    else return;

                    const response = JSON.parse(rawData);

                    if (response.setupComplete) {
                        setConnected(true);
                        setConnecting(false);
                        setStatus("Đang nghe — bạn có thể nói chuyện");
                    }

                    if (response.error) {
                        setError(response.error.message || "Gemini trả về lỗi.");
                        setConnecting(false);
                        return;
                    }

                    // Xử lý Tool Calls (n8n RAG)
                    const functionCalls = response.toolCall?.functionCalls || [];
                    for (const functionCall of functionCalls) {
                        if (functionCall.name !== "searchCustomerSupport") continue;
                        const question = String(functionCall.args?.question || "").trim();
                        if (!question) continue;

                        setStatus("Đang tra cứu tài liệu VKU Support...");
                        try {
                            c// Trong hàm socket.onmessage -> phần xử lý functionCalls (searchCustomerSupport)
                            const ragResponse = await fetch(`${BACKEND_URL}/api/chat/voice-message`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    // Sử dụng trực tiếp mã conversationId được truyền từ page.tsx
                                    conversationId: conversationId,
                                    customerId: customerId,
                                    message: question,
                                }),
                            });

                            const ragData = await ragResponse.json();
                            const reply = String(ragData.reply || "Kho tri thức chưa có câu trả lời phù hợp.");

                            socket.send(JSON.stringify({
                                toolResponse: {
                                    functionResponses: [{
                                        id: functionCall.id,
                                        name: functionCall.name,
                                        response: {
                                            success: ragData.success !== false,
                                            result: reply,
                                            needHumanSupport: Boolean(ragData.needHumanSupport),
                                        },
                                    }],
                                },
                            }));
                            setStatus("Đã tra cứu tài liệu — Gemini đang trả lời...");
                        } catch {
                            socket.send(JSON.stringify({
                                toolResponse: {
                                    functionResponses: [{
                                        id: functionCall.id,
                                        name: functionCall.name,
                                        response: { success: false, result: "Không thể truy cập kho tri thức lúc này." },
                                    }],
                                },
                            }));
                        }
                    }

                    const content = response.serverContent;
                    if (!content) return;

                    // 1. Nối chuỗi câu hỏi của Người dùng (User)
                    if (content.inputTranscription?.text) {
                        const chunk = content.inputTranscription.text;
                        currentUserTextRef.current += chunk;

                        setMessages((old) => {
                            if (isUserStreamingRef.current && old.length > 0 && old[old.length - 1].role === "Bạn") {
                                const updated = [...old];
                                updated[updated.length - 1] = { role: "Bạn", text: currentUserTextRef.current };
                                return updated;
                            } else {
                                isUserStreamingRef.current = true;
                                return [...old, { role: "Bạn", text: currentUserTextRef.current }];
                            }
                        });
                    }

                    // 2. Nối chuỗi câu trả lời của Gemini (AI)
                    if (content.outputTranscription?.text) {
                        if (isUserStreamingRef.current) {
                            isUserStreamingRef.current = false;
                            currentUserTextRef.current = "";
                        }

                        const chunk = content.outputTranscription.text;
                        currentAiTextRef.current += chunk;

                        setMessages((old) => {
                            if (isAiStreamingRef.current && old.length > 0 && old[old.length - 1].role === "Gemini") {
                                const updated = [...old];
                                updated[updated.length - 1] = { role: "Gemini", text: currentAiTextRef.current };
                                return updated;
                            } else {
                                isAiStreamingRef.current = true;
                                return [...old, { role: "Gemini", text: currentAiTextRef.current }];
                            }
                        });
                    }

                    // 3. Phát âm thanh PCM 24kHz
                    const parts = content.modelTurn?.parts || [];
                    for (const part of parts) {
                        const inlineData = part.inlineData;
                        if (!inlineData?.data) continue;

                        const outputContext = outputContextRef.current;
                        if (!outputContext) continue;

                        const samples = pcm24kToFloat32(inlineData.data);
                        const audioBuffer = outputContext.createBuffer(1, samples.length, 24000);
                        audioBuffer.copyToChannel(samples, 0);

                        const sourceNode = outputContext.createBufferSource();
                        sourceNode.buffer = audioBuffer;
                        sourceNode.connect(outputContext.destination);

                        const startAt = Math.max(outputContext.currentTime, nextPlayTimeRef.current);
                        sourceNode.start(startAt);
                        nextPlayTimeRef.current = startAt + audioBuffer.duration;
                    }

                    // 4. Hoàn thành câu của Gemini
                    if (content.turnComplete) {
                        isAiStreamingRef.current = false;
                        currentAiTextRef.current = "";
                        setStatus("Đang nghe — bạn có thể tiếp tục nói");
                    }
                } catch {
                    setError("Không đọc được dữ liệu trả về từ Gemini.");
                }
            };

            socket.onerror = () => setError("Lỗi kết nối WebSocket Gemini.");
            socket.onclose = (event) => setStatus(`Kết nối đã đóng (${event.code})`);
        } catch (e) {
            stop();
            setError(e instanceof Error ? e.message : "Không thể bắt đầu hội thoại Voice.");
        }
    };

    return (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-900">AI Voice — Gemini Live Stream</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{status}</p>
                </div>
                {!connected ? (
                    <button
                        onClick={start}
                        disabled={connecting}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                    >
                        {connecting ? "Đang kết nối..." : "Bắt đầu hội thoại Voice"}
                    </button>
                ) : (
                    <button
                        onClick={stop}
                        className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                    >
                        Kết thúc
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="max-h-60 space-y-2.5 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100">
                {messages.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Nhấn "Bắt đầu hội thoại Voice" để trò chuyện trực tiếp qua Micro.</p>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className="rounded-xl bg-white p-3 border border-slate-200/60 shadow-2xs">
                            <p className="text-[11px] font-bold text-indigo-600">{message.role}</p>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mt-0.5">{message.text}</p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}