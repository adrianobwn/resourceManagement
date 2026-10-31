package com.resourceManagement.service.assignment;

import com.resourceManagement.model.entity.AssignmentRequest;
import com.resourceManagement.model.entity.Project;
import com.resourceManagement.model.entity.Resource;
import com.resourceManagement.model.entity.ResourceAssignment;
import com.resourceManagement.model.entity.User;
import com.resourceManagement.model.enums.NotificationType;
import com.resourceManagement.model.enums.RequestStatus;
import com.resourceManagement.model.enums.RequestType;
import com.resourceManagement.repository.AssignmentRequestRepository;
import com.resourceManagement.service.project.HistoryLogService;
import com.resourceManagement.service.project.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Run: ./mvnw test -Dtest=ResourceAssignmentServiceTest
@ExtendWith(MockitoExtension.class)
class ResourceAssignmentServiceTest {

    @Mock AssignmentRequestRepository requestRepository;
    @Mock HistoryLogService historyLogService;
    @Mock NotificationService notificationService;
    @InjectMocks ResourceAssignmentService service;

    @Test
    void releasingAnAssignmentRejectsItsPendingRequests() {
        User devMan = User.builder().userId(2).name("Budi").build();
        ResourceAssignment assignment = ResourceAssignment.builder()
                .assignmentId(7)
                .resource(Resource.builder().resourceName("Andi").build())
                .project(Project.builder().projectName("Sistem Kasir").build())
                .projectRole("Backend Developer")
                .build();
        AssignmentRequest pending = AssignmentRequest.builder()
                .requestType(RequestType.EXTEND).status(RequestStatus.PENDING).requester(devMan).assignmentId(7).build();
        when(requestRepository.findByAssignmentIdAndStatus(7, RequestStatus.PENDING)).thenReturn(List.of(pending));

        service.rejectPendingRequests(assignment, User.builder().name("Dewi").build(), "directly by Dewi");

        assertEquals(RequestStatus.REJECTED, pending.getStatus());
        assertTrue(pending.getRejectionReason().startsWith("Assignment was released directly by Dewi on "));
        verify(requestRepository).save(pending);
        verify(notificationService).createNotification(eq(devMan), eq(NotificationType.APPROVAL_RESULT), anyString());
    }
}
