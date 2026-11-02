package com.example.cd2.entity;

import com.example.cd2.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "messages", indexes = {
        @Index(name = "idx_message_ticket", columnList = "ticket_id")
})
public class Message extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SenderType senderType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;                  // khi senderType = STAFF

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Channel channel;

    @Column(name = "content_original", nullable = false, columnDefinition = "text")
    private String contentOriginal;

    @Column(name = "content_translated", columnDefinition = "text")
    private String contentTranslated;     // ban tieng Viet (L03)

    @Column(length = 10)
    private String language;

    @Column(name = "ai_confidence")
    private Double aiConfidence;          // chi dung khi senderType = AI

    @Column(name = "approved_by_human", nullable = false)
    private boolean approvedByHuman = false;
}
