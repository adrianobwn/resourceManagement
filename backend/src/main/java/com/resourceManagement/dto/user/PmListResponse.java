package com.resourceManagement.dto.user;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmListResponse {
    private Integer userId;
    private String name;
    private String email;
    private Integer projectCount;
}
