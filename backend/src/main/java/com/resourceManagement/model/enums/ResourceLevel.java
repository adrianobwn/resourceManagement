package com.resourceManagement.model.enums;

public enum ResourceLevel {
    ABT,
    BT,
    SBT,
    CEO;

    /** Only levels above ABT may mentor someone as Reporting Manager. */
    public boolean canBeReportingManager() {
        return this != ABT;
    }
}
