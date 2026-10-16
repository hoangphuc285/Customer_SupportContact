package com.example.cd2.dto;

public class VoiceMessageRequest {
    private String conversationId;
    private Long customerId;
    private String message;

    public VoiceMessageRequest() {}

    public VoiceMessageRequest(String conversationId, Long customerId, String message) {
        this.conversationId = conversationId;
        this.customerId = customerId;
        this.message = message;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}