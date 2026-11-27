package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepo;

    @Mock
    private CustomerRepository customerRepo;

    @Mock
    private CustomerOrderRepository orderRepo;

    @Mock
    private WarrantyCaseRepository warrantyCaseRepo;

    @Mock
    private RefundRepository refundRepo;

    @Mock
    private TicketRepository ticketRepo;

    @Mock
    private AuditLogRepository auditLogRepo;

    @Mock
    private N8nClientService n8nService;

    @InjectMocks
    private NotificationService notificationService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setId(10L);
        sampleCustomer.setFullName("Nguyen Van Test");
        sampleCustomer.setEmail("test@customer.local");
        sampleCustomer.setNotifyOptOut(false);
    }

    @Test
    void testDeliveredOrderGeneratesNotification() {
        CustomerOrder order = new CustomerOrder();
        order.setId(101L);
        order.setOrderCode("ORD-101");
        order.setCustomer(sampleCustomer);
        order.setStatus(OrderStatus.DELIVERED);
        order.setTotalAmount(BigDecimal.valueOf(500000));

        when(orderRepo.findByStatus(OrderStatus.DELIVERED)).thenReturn(List.of(order));
        when(orderRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(warrantyCaseRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(refundRepo.findByStatusInOrderByIdDesc(anyList())).thenReturn(Collections.emptyList());
        when(notificationRepo.existsByDedupeKey("ORDER_DELIVERED:101")).thenReturn(false);

        when(notificationRepo.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(1L);
            return n;
        });

        Map<String, Object> result = notificationService.runLocalNotificationScan("TEST_RUNNER");

        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertEquals(1, result.get("totalCreated"));
        verify(notificationRepo, times(1)).save(any(Notification.class));
    }

    @Test
    void testDeduplicationSkipsExistingKey() {
        CustomerOrder order = new CustomerOrder();
        order.setId(102L);
        order.setOrderCode("ORD-102");
        order.setCustomer(sampleCustomer);
        order.setStatus(OrderStatus.DELIVERED);

        when(orderRepo.findByStatus(OrderStatus.DELIVERED)).thenReturn(List.of(order));
        when(orderRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(warrantyCaseRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(refundRepo.findByStatusInOrderByIdDesc(anyList())).thenReturn(Collections.emptyList());
        // Khóa dedupe đã tồn tại -> phải bỏ qua
        when(notificationRepo.existsByDedupeKey("ORDER_DELIVERED:102")).thenReturn(true);

        Map<String, Object> result = notificationService.runLocalNotificationScan("TEST_RUNNER");

        assertEquals(0, result.get("totalCreated"));
        verify(notificationRepo, never()).save(any(Notification.class));
    }

    @Test
    void testOptOutSetsSkippedStatus() {
        sampleCustomer.setNotifyOptOut(true); // Khách đã từ chối nhận thông báo

        CustomerOrder order = new CustomerOrder();
        order.setId(103L);
        order.setOrderCode("ORD-103");
        order.setCustomer(sampleCustomer);
        order.setStatus(OrderStatus.DELIVERED);

        when(orderRepo.findByStatus(OrderStatus.DELIVERED)).thenReturn(List.of(order));
        when(orderRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(warrantyCaseRepo.findByStatusIn(anyList())).thenReturn(Collections.emptyList());
        when(refundRepo.findByStatusInOrderByIdDesc(anyList())).thenReturn(Collections.emptyList());
        when(notificationRepo.existsByDedupeKey("ORDER_DELIVERED:103")).thenReturn(false);

        when(notificationRepo.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            assertEquals(NotificationStatus.SKIPPED_OPT_OUT, n.getStatus());
            assertNull(n.getSentAt());
            return n;
        });

        Map<String, Object> result = notificationService.runLocalNotificationScan("TEST_RUNNER");

        assertEquals(1, result.get("totalCreated"));
        assertEquals(1, result.get("optOutSkipped"));
    }

    @Test
    void testQuietHoursCalculation() {
        // 22:30 giờ VN -> Giờ yên lặng (true)
        Instant night = ZonedDateTime.of(2026, 11, 27, 22, 30, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        assertTrue(NotificationService.isQuietHours(night));

        // 03:00 giờ VN -> Giờ yên lặng (true)
        Instant earlyMorning = ZonedDateTime.of(2026, 11, 27, 3, 0, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        assertTrue(NotificationService.isQuietHours(earlyMorning));

        // 14:00 giờ VN -> Ngoài giờ yên lặng (false)
        Instant afternoon = ZonedDateTime.of(2026, 11, 27, 14, 0, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        assertFalse(NotificationService.isQuietHours(afternoon));
    }

    @Test
    void testWebhookEventHandling() {
        when(customerRepo.findById(10L)).thenReturn(Optional.of(sampleCustomer));
        when(notificationRepo.existsByDedupeKey("WARRANTY_STATUS:99:COMPLETED")).thenReturn(false);
        when(notificationRepo.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(999L);
            return n;
        });

        Map<String, Object> payload = Map.of(
                "event_type", "WARRANTY_STATUS",
                "ref_id", "99",
                "sub_status", "COMPLETED",
                "customer_id", 10L,
                "title", "Bảo hành #WC-99 hoàn tất",
                "content", "Sản phẩm của quý khách đã sửa xong."
        );

        Map<String, Object> res = notificationService.handleWebhookEvent(payload);

        assertNotNull(res);
        assertTrue((Boolean) res.get("success"));
        assertEquals(999L, res.get("notificationId"));
        assertEquals("WARRANTY_STATUS:99:COMPLETED", res.get("dedupeKey"));
    }
}
