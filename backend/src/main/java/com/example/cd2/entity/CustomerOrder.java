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
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_customer", columnList = "customer_id")
})
public class CustomerOrder extends BaseEntity {

    @Column(name = "order_code", nullable = false, unique = true, length = 40)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_fee", nullable = false, precision = 15, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "ordered_at", nullable = false)
    private Instant orderedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;          // dung de tinh han doi tra (L09)

    @Column(name = "tracking_code", length = 60)
    private String trackingCode;
}
