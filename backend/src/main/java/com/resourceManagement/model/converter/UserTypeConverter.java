package com.resourceManagement.model.converter;

import com.resourceManagement.model.enums.UserType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter for UserType enum to handle legacy "PM" values in database
 * Automatically converts "PM" to "DEV_MANAGER" when reading from database
 */
@Converter(autoApply = true)
public class UserTypeConverter implements AttributeConverter<UserType, String> {

    @Override
    public String convertToDatabaseColumn(UserType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public UserType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        
        // Backward compatibility: Convert old PM to DEV_MANAGER
        if ("PM".equals(dbData)) {
            return UserType.DEV_MANAGER;
        }
        
        // Backward compatibility: Convert old ADMIN to Admin
        if ("ADMIN".equals(dbData)) {
            return UserType.Admin;
        }
        
        return UserType.valueOf(dbData);
    }
}
