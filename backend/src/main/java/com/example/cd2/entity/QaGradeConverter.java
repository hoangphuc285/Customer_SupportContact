package com.example.cd2.entity;

import com.example.cd2.enums.QaGrade;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

/**
 * Chuyển đổi an toàn giá trị grade trong qa_scores (hỗ trợ cả PASS/FAIL chuẩn lẫn PASSED/FAILED dữ liệu cũ).
 */
@Converter
public class QaGradeConverter implements AttributeConverter<QaGrade, String> {

    @Override
    public String convertToDatabaseColumn(QaGrade attribute) {
        return attribute != null ? attribute.name() : QaGrade.NEEDS_IMPROVEMENT.name();
    }

    @Override
    public QaGrade convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return QaGrade.NEEDS_IMPROVEMENT;
        }
        String normalized = dbData.trim().toUpperCase(Locale.ROOT);
        if ("PASS".equals(normalized) || "PASSED".equals(normalized)) {
            return QaGrade.PASS;
        }
        if ("FAIL".equals(normalized) || "FAILED".equals(normalized)) {
            return QaGrade.FAIL;
        }
        if ("NEEDS_IMPROVEMENT".equals(normalized)) {
            return QaGrade.NEEDS_IMPROVEMENT;
        }
        return QaGrade.NEEDS_IMPROVEMENT;
    }
}
