package com.resourceManagement.model.enums;

public enum NotificationType {
    PROJECT_CREATED,
    PROJECT_REQUEST,
    RESOURCE_REQUEST,
    APPROVAL_RESULT,
    EXPIRY_REMINDER;

    /**
     * Approve/reject outcomes surface on the Activities page; everything else
     * belongs to the Notifications page. Each badge clears only its own group.
     */
    public boolean isActivity() {
        return this == APPROVAL_RESULT;
    }
}