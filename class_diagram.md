# Class Diagram - Resource Management Inteleq

Dokumen ini berisi kode diagram kelas (*class diagram*) menggunakan Mermaid yang telah diperbarui dengan penerapan visibilitas OOP secara ketat:
* **`-` (Private)**: Digunakan untuk properti/atribut entitas (sesuai standar enkapsulasi Java RDBMS), serta dependensi internal (dependency injection) pada Controller dan Service.
* **`+` (Public)**: Digunakan untuk metode bisnis Service, REST endpoints Controller, properti DTO, serta metode di level View.

---

```mermaid
classDiagram
%% ======================================================
%% VIEW LAYER (BOUNDARY - REACT SPA PAGES)
%% ======================================================
class LoginView {
  +handleSubmit(Event e) void
}

class AdminDashboardView
class AdminProjectView
class AdminResourcesView
class AdminDevmanView
class AdminActivitiesView
class AdminNotificationsView

class DevmanDashboardView
class DevmanProjectView
class DevmanResourcesView
class DevmanActivitiesView
class DevmanNotificationsView

%% ======================================================
%% CONTROLLER LAYER (REST CONTROLLERS)
%% ======================================================
class AuthController {
  -AuthService authService
  +login(LoginRequest request) ResponseEntity~LoginResponse~
}

class DashboardController {
  -DashboardService dashboardService
  +getStats() ResponseEntity~DashboardStatsResponse~
  +getAssignmentsEndingSoon(int days) ResponseEntity~List~AssignmentEndingSoonResponse~~
}

class UserController {
  -UserService userService
  +createPm(CreatePmRequest request) ResponseEntity
  +getAllPms() ResponseEntity~List~PmListResponse~~
  +updateUser(Integer userId, UpdateUserRequest request) ResponseEntity
  +deleteUser(Integer userId) ResponseEntity
}

class ProjectController {
  -ProjectService projectService
  +getAllProjects() ResponseEntity~List~ProjectListResponse~~
  +createProject(CreateProjectRequest request) ResponseEntity~ProjectListResponse~
  +getProjectResources(Integer projectId) ResponseEntity~List~ProjectResourceDto~~
  +updateProjectStatus(Integer projectId, ProjectStatus status) ResponseEntity~ProjectListResponse~
  +updateProject(Integer projectId, UpdateProjectRequest request) ResponseEntity~ProjectListResponse~
  +deleteProject(Integer projectId) ResponseEntity
}

class ResourceController {
  -ResourceService resourceService
  +getAllResources() ResponseEntity~List~ResourceResponse~~
  +getResourceById(Integer resourceId) ResponseEntity~ResourceResponse~
  +createResource(CreateResourceRequest request) ResponseEntity~ResourceResponse~
  +assignResource(AssignResourceRequest request) ResponseEntity~ResourceResponse~
  +getResourceAssignments(Integer resourceId) ResponseEntity~List~AssignmentInfo~~
  +updateResource(Integer resourceId, UpdateResourceRequest request) ResponseEntity~ResourceResponse~
  +deleteResource(Integer resourceId) ResponseEntity
}

class ResourceAssignmentController {
  -ResourceAssignmentService assignmentService
  -AssignmentRequestService requestService
  +createAssignment(ResourceAssignment assignment) ResponseEntity~ResourceAssignment~
  +getAllAssignments() ResponseEntity~List~ResourceAssignment~~
  +extendAssignment(ExtendAssignmentRequest request) ResponseEntity~String~
  +releaseAssignment(ReleaseAssignmentRequest request) ResponseEntity~String~
}

class RequestController {
  -AssignmentRequestService requestService
  +getRequests() ResponseEntity~List~AssignmentRequestResponse~~
  +getRequestHistory() ResponseEntity~List~AssignmentRequestResponse~~
  +getPendingRequestsByProject(Integer projectId) ResponseEntity~List~AssignmentRequestResponse~~
  +submitProjectProposal(ProjectProposalRequest request) ResponseEntity~String~
  +submitAssignRequest(AssignResourceRequest request) ResponseEntity~String~
  +approveRequest(Integer id) ResponseEntity~String~
  +rejectRequest(Integer id, Map~String_String~ body) ResponseEntity~String~
}

class HistoryLogController {
  -HistoryLogService historyLogService
  +getAllHistoryLogs() ResponseEntity~List~HistoryLogResponse~~
}

%% VIEW -> CONTROLLER RELATIONS
LoginView --> AuthController
AdminDashboardView --> DashboardController
AdminDashboardView --> RequestController
AdminNotificationsView --> RequestController
AdminProjectView --> ProjectController
AdminResourcesView --> ResourceController
AdminDevmanView --> UserController
AdminActivitiesView --> HistoryLogController

DevmanDashboardView --> DashboardController
DevmanDashboardView --> RequestController
DevmanNotificationsView --> RequestController
DevmanProjectView --> ProjectController
DevmanResourcesView --> ResourceController
DevmanResourcesView --> ResourceAssignmentController
DevmanActivitiesView --> HistoryLogController

%% ======================================================
%% SERVICE LAYER (LOGIKA BISNIS)
%% ======================================================
class AuthService {
  -UserRepository userRepository
  -PasswordEncoder passwordEncoder
  -JwtUtil jwtUtil
  +login(LoginRequest request) LoginResponse
}

class DashboardService {
  -ResourceRepository resourceRepository
  -ProjectRepository projectRepository
  -ResourceAssignmentRepository assignmentRepository
  -AssignmentRequestService requestService
  -UserRepository userRepository
  +getStats() DashboardStatsResponse
  +getAssignmentsEndingSoon(int days) List~AssignmentEndingSoonResponse~
}

class UserService {
  -UserRepository userRepository
  -PasswordEncoder passwordEncoder
  -ProjectRepository projectRepository
  -AssignmentRequestRepository assignmentRequestRepository
  -HistoryLogRepository historyLogRepository
  -HistoryLogService historyLogService
  +createPm(CreatePmRequest request) void
  +getAllPms() List~PmListResponse~
  +updateUser(Integer userId, UpdateUserRequest request) void
  +deleteUser(Integer userId) void
}

class ProjectService {
  -ProjectRepository projectRepository
  -UserRepository userRepository
  -ResourceAssignmentRepository resourceAssignmentRepository
  -AssignmentRequestRepository requestRepository
  -HistoryLogRepository historyLogRepository
  -HistoryLogService historyLogService
  -AssignmentRequestService assignmentRequestService
  +getAllProjects() List~ProjectListResponse~
  +createProject(CreateProjectRequest request) ProjectListResponse
  +getProjectResources(Integer projectId) List~ProjectResourceDto~
  +updateProjectStatus(Integer projectId, ProjectStatus status) ProjectListResponse
  +updateProject(Integer projectId, UpdateProjectRequest request) ProjectListResponse
  +deleteProject(Integer projectId) void
}

class ResourceService {
  -ResourceRepository resourceRepository
  -ResourceAssignmentRepository assignmentRepository
  -ProjectRepository projectRepository
  -UserRepository userRepository
  -HistoryLogService historyLogService
  -AssignmentRequestRepository requestRepository
  -AssignmentRequestService requestService
  -ProjectRequestResourceRepository projectRequestResourceRepository
  -HistoryLogRepository historyLogRepository
  +getAllResources() List~ResourceResponse~
  +getResourceById(Integer resourceId) ResourceResponse
  +createResource(CreateResourceRequest request) ResourceResponse
  +assignResourceToProject(AssignResourceRequest request) ResourceResponse
  +getResourceAssignments(Integer resourceId) List~AssignmentInfo~
  +updateResource(Integer resourceId, UpdateResourceRequest request) ResourceResponse
  +deleteResource(Integer resourceId) void
}

class ResourceAssignmentService {
  -ResourceAssignmentRepository assignmentRepository
  -ResourceRepository resourceRepository
  -AssignmentRequestRepository requestRepository
  -HistoryLogService historyLogService
  -UserRepository userRepository
  -ProjectRepository projectRepository
  +assignResourceToProject(ResourceAssignment assignment) ResourceAssignment
  +extendAssignment(ExtendAssignmentRequest request) ResourceAssignment
  +releaseAssignment(ReleaseAssignmentRequest request) ResourceAssignment
  +processRelease(ResourceAssignment assignment, User performedBy) ResourceAssignment
  +autoReleaseAssignments() void
  +getAllAssignments() List~ResourceAssignment~
  +getAssignmentById(Integer id) ResourceAssignment
}

class AssignmentRequestService {
  -AssignmentRequestRepository requestRepository
  -UserRepository userRepository
  -ResourceAssignmentRepository assignmentRepository
  -ResourceAssignmentService resourceAssignmentService
  -ProjectRepository projectRepository
  -ResourceRepository resourceRepository
  -HistoryLogService historyLogService
  +createExtendRequest(String requesterEmail, ExtendAssignmentRequest dto) void
  +createReleaseRequest(String requesterEmail, ReleaseAssignmentRequest dto) void
  +createAssignRequest(String requesterEmail, AssignResourceRequest dto) void
  +submitProjectProposal(String email, ProjectProposalRequest dto) void
  +getPendingRequests(String userEmail) List~AssignmentRequest~
  +getAllRequests(String userEmail) List~AssignmentRequest~
  +getPendingRequestsByProject(Integer projectId) List~AssignmentRequest~
  +approveRequest(Integer requestId) void
  +rejectRequest(Integer requestId, String reason) void
  +recordDirectAction(User performedBy, RequestType type, AssignmentRequest details) void
}

class HistoryLogService {
  -HistoryLogRepository historyLogRepository
  -UserRepository userRepository
  +logActivity(EntityType entityType, String activityType, String description, User performedBy) void
  +logActivity(EntityType entityType, String activityType, String description, User performedBy, Project project) void
  +logActivity(EntityType entityType, String activityType, String description, User performedBy, Project project, Resource resource, String role) void
  +getAllLogs(String userEmail) List~HistoryLogResponse~
}

%% CONTROLLER -> SERVICE RELATIONS
AuthController --> AuthService
DashboardController --> DashboardService
UserController --> UserService
ProjectController --> ProjectService
ResourceController --> ResourceService
ResourceAssignmentController --> ResourceAssignmentService
ResourceAssignmentController --> AssignmentRequestService
RequestController --> AssignmentRequestService
HistoryLogController --> HistoryLogService

%% SERVICE DEPENDENCIES
DashboardService ..> AssignmentRequestService
ProjectService ..> AssignmentRequestService
ResourceService ..> AssignmentRequestService
AssignmentRequestService ..> ResourceAssignmentService
AssignmentRequestService ..> HistoryLogService
ResourceAssignmentService ..> HistoryLogService
ProjectService ..> HistoryLogService
ResourceService ..> HistoryLogService
UserService ..> HistoryLogService

%% ======================================================
%% REPOSITORY LAYER (JPA REPOSITORIES)
%% ======================================================
class UserRepository {
  +findByEmail(String email) Optional~User~
  +findByUserType(UserType userType) List~User~
  +existsByEmail(String email) boolean
}

class ProjectRepository {
  +findByDevMan_UserId(Integer devManId) List~Project~
  +countByStatus(ProjectStatus status) long
  +countByDevMan_UserIdAndStatus(Integer devManId, ProjectStatus status) long
  +countByDevMan_UserId(Integer devManId) long
  +existsByDevMan_UserId(Integer devManId) boolean
}

class ResourceRepository {
  +existsByEmail(String email) boolean
  +countByStatus(ResourceStatus status) long
}

class ResourceAssignmentRepository {
  +findByResource_ResourceId(Integer resourceId) List~ResourceAssignment~
  +findByProject_ProjectId(Integer projectId) List~ResourceAssignment~
  +findByStatus(AssignmentStatus status) List~ResourceAssignment~
  +findByStatusAndEndDateBetween(AssignmentStatus status, LocalDate startDate, LocalDate endDate) List~ResourceAssignment~
  +findByStatusAndEndDateBefore(AssignmentStatus status, LocalDate date) List~ResourceAssignment~
  +findByStatusAndProject_DevMan_UserIdAndEndDateBetween(AssignmentStatus status, Integer devManId, LocalDate startDate, LocalDate endDate) List~ResourceAssignment~
  +countByProject_ProjectId(Integer projectId) long
  +countByProject_ProjectIdAndStatus(Integer projectId, AssignmentStatus status) long
  +countByResource_ResourceIdAndProject_ProjectIdAndStatus(Integer resourceId, Integer projectId, AssignmentStatus status) long
  +countByResource_ResourceIdAndProject_ProjectIdAndProjectRoleAndStatus(Integer resourceId, Integer projectId, String projectRole, AssignmentStatus status) long
  +countByResource_ResourceIdAndStatus(Integer resourceId, AssignmentStatus status) long
  +deleteByResource_ResourceId(Integer resourceId) void
  +deleteByProject_ProjectId(Integer projectId) void
}

class AssignmentRequestRepository {
  +findByStatus(RequestStatus status) List~AssignmentRequest~
  +findByRequester_UserIdAndStatus(Integer requesterId, RequestStatus status) List~AssignmentRequest~
  +findByRequester_UserIdOrProject_DevMan_UserId(Integer requesterId, Integer devManId) List~AssignmentRequest~
  +findByProject_ProjectIdAndStatus(Integer projectId, RequestStatus status) List~AssignmentRequest~
  +countByResource_ResourceIdAndProject_ProjectIdAndRoleAndStatus(Integer resourceId, Integer projectId, String role, RequestStatus status) long
  +deleteByRequester_UserId(Integer requesterId) void
  +deleteByResource_ResourceId(Integer resourceId) void
  +deleteByProject_ProjectId(Integer projectId) void
}

class ProjectRequestResourceRepository {
  +deleteByResource_ResourceId(Integer resourceId) void
}

class HistoryLogRepository {
  +findAllByOrderByTimestampDesc() List~HistoryLog~
  +findByPerformedBy_UserIdOrProject_DevMan_UserIdOrderByTimestampDesc(Integer performerId, Integer devManId) List~HistoryLog~
  +findByEntityTypeOrderByTimestampDesc(String entityType) List~HistoryLog~
  +deleteByResource_ResourceId(Integer resourceId) void
  +deleteByPerformedBy_UserId(Integer performerId) void
  +deleteByProject_ProjectId(Integer projectId) void
}

%% SERVICE -> REPOSITORY RELATIONS
AuthService --> UserRepository
DashboardService --> ResourceRepository
DashboardService --> ProjectRepository
DashboardService --> ResourceAssignmentRepository
DashboardService --> AssignmentRequestRepository
UserService --> UserRepository
UserService --> ProjectRepository
UserService --> AssignmentRequestRepository
UserService --> HistoryLogRepository
ProjectService --> ProjectRepository
ProjectService --> UserRepository
ProjectService --> ResourceAssignmentRepository
ProjectService --> AssignmentRequestRepository
ProjectService --> HistoryLogRepository
ResourceService --> ResourceRepository
ResourceService --> ResourceAssignmentRepository
ResourceService --> ProjectRepository
ResourceService --> UserRepository
ResourceService --> AssignmentRequestRepository
ResourceService --> ProjectRequestResourceRepository
ResourceService --> HistoryLogRepository
ResourceAssignmentService --> ResourceAssignmentRepository
ResourceAssignmentService --> ResourceRepository
ResourceAssignmentService --> AssignmentRequestRepository
ResourceAssignmentService --> UserRepository
ResourceAssignmentService --> ProjectRepository
AssignmentRequestService --> AssignmentRequestRepository
AssignmentRequestService --> UserRepository
AssignmentRequestService --> ResourceAssignmentRepository
AssignmentRequestService --> ProjectRepository
AssignmentRequestService --> ResourceRepository
HistoryLogService --> HistoryLogRepository
HistoryLogService --> UserRepository

%% ======================================================
%% ENTITY LAYER (DATABASE SCHEMAS)
%% ======================================================
class User {
  -Integer userId
  -String name
  -String email
  -String password
  -UserType userType
  -AccountStatus accountStatus
}

class Project {
  -Integer projectId
  -String projectName
  -String clientName
  -User devMan
  -ProjectStatus status
}

class Resource {
  -Integer resourceId
  -String resourceName
  -String employeeId
  -String email
  -ResourceStatus status
}

class ResourceAssignment {
  -Integer assignmentId
  -Resource resource
  -Project project
  -String projectRole
  -LocalDate startDate
  -LocalDate endDate
  -AssignmentStatus status
}

class AssignmentRequest {
  -Integer requestId
  -RequestType requestType
  -RequestStatus status
  -User requester
  -Project project
  -Resource resource
  -String projectName
  -String clientName
  -String description
  -Collection~ProjectRequestResource~ resourcePlan
  -Integer assignmentId
  -String role
  -LocalDate startDate
  -LocalDate endDate
  -LocalDate newEndDate
  -LocalDate currentEndDate
  -String reason
  -String rejectionReason
  -LocalDateTime createdAt
  #onCreate() void
}

class ProjectRequestResource {
  -Integer id
  -AssignmentRequest assignmentRequest
  -Resource resource
  -String role
  -LocalDate startDate
  -LocalDate endDate
}

class HistoryLog {
  -Integer logId
  -EntityType entityType
  -String activityType
  -String description
  -User performedBy
  -Project project
  -Resource resource
  -String resourceRole
  -LocalDateTime timestamp
}

%% REPOSITORY -> ENTITY ORM BINDING
UserRepository ..> User
ProjectRepository ..> Project
ResourceRepository ..> Resource
ResourceAssignmentRepository ..> ResourceAssignment
AssignmentRequestRepository ..> AssignmentRequest
ProjectRequestResourceRepository ..> ProjectRequestResource
HistoryLogRepository ..> HistoryLog

%% ENTITY RELATIONSHIPS
User "1" --> "0..*" Project : "assigned DevManager"
User "1" --> "0..*" AssignmentRequest : "submits"
Project "1" --> "0..*" ResourceAssignment : "contains"
Resource "1" --> "0..*" ResourceAssignment : "is allocated"
AssignmentRequest "1" *-- "0..*" ProjectRequestResource : "has resource plan"
Resource "1" --> "0..*" ProjectRequestResource : "planned"
HistoryLog --> User : "performedBy"
HistoryLog --> Project : "related project"
HistoryLog --> Resource : "related resource"

%% ======================================================
%% ENUMERATIONS
%% ======================================================
class UserType {
  <<enumeration>>
  Admin
  DEV_MANAGER
}
class AccountStatus {
  <<enumeration>>
  ACTIVE
  SUSPENDED
}
class ProjectStatus {
  <<enumeration>>
  ONGOING
  HOLD
  CLOSED
}
class ResourceStatus {
  <<enumeration>>
  AVAILABLE
  ASSIGNED
}
class AssignmentStatus {
  <<enumeration>>
  ACTIVE
  RELEASED
  EXPIRED
}
class RequestType {
  <<enumeration>>
  ASSIGN
  EXTEND
  RELEASE
  PROJECT
}
class RequestStatus {
  <<enumeration>>
  PENDING
  APPROVED
  REJECTED
}
class EntityType {
  <<enumeration>>
  USER
  PROJECT
  RESOURCE
  ASSIGNMENT
  REQUEST
}

User --> UserType
User --> AccountStatus
Project --> ProjectStatus
Resource --> ResourceStatus
ResourceAssignment --> AssignmentStatus
AssignmentRequest --> RequestType
AssignmentRequest --> RequestStatus
HistoryLog --> EntityType

%% ======================================================
%% DTO LAYER (DATA TRANSFER OBJECTS)
%% ======================================================
class LoginRequest {
  +String email
  +String password
}
class LoginResponse {
  +String token
  +String name
  +String email
  +String userType
}
class CreatePmRequest {
  +String name
  +String email
  +String password
}
class PmListResponse {
  +Integer userId
  +String name
  +String email
  +int projectCount
}
class UpdateUserRequest {
  +String name
  +String email
}
class CreateProjectRequest {
  +String projectName
  +String clientName
  +Integer devManId
}
class ProjectListResponse {
  +Integer projectId
  +String projectName
  +String clientName
  +String devManName
  +Integer devManId
  +int memberCount
  +String status
}
class ProjectResourceDto {
  +String resourceName
  +String role
  +LocalDate startDate
  +LocalDate endDate
  +String status
  +Integer assignmentId
}
class UpdateProjectRequest {
  +String projectName
  +String clientName
  +ProjectStatus status
}
class CreateResourceRequest {
  +String resourceName
  +String email
  +ResourceStatus status
}
class UpdateResourceRequest {
  +String resourceName
  +String email
}
class ResourceResponse {
  +Integer resourceId
  +String resourceName
  +String employeeId
  +String email
  +ResourceStatus status
  +int projectCount
  +int totalAssignments
  +List~AssignmentInfo~ currentAssignments
}
class AssignResourceRequest {
  +Integer resourceId
  +Integer projectId
  +String projectRole
  +String startDate
  +String endDate
}
class ExtendAssignmentRequest {
  +Integer assignmentId
  +LocalDate newEndDate
  +String reason
}
class ReleaseAssignmentRequest {
  +Integer assignmentId
  +LocalDate releaseDate
  +String reason
}
class ProjectProposalRequest {
  +String projectName
  +String clientName
  +String description
  +List~ResourcePlanItem~ resourcePlan
}
class AssignmentRequestResponse {
  +Integer id
  +Integer assignmentId
  +String type
  +String status
  +String requester
  +String resource
  +String project
  +String role
  +LocalDate startDate
  +LocalDate currentEndDate
  +LocalDate newEndDate
  +String reason
  +String rejectionReason
  +LocalDateTime submittedDate
  +String projectName
  +String clientName
  +String description
  +List~ResourcePlanItem~ resourcePlan
}
class HistoryLogResponse {
  +Integer logId
  +String entityType
  +String activityType
  +String projectName
  +String resourceName
  +String resourceRole
  +String description
  +String performedBy
  +LocalDateTime timestamp
}
class DashboardStatsResponse {
  +long totalResources
  +long availableResources
  +long activeProjects
  +long pendingRequests
}
class AssignmentEndingSoonResponse {
  +Integer assignmentId
  +Integer projectId
  +String resourceName
  +String projectRole
  +String projectName
  +LocalDate endDate
  +long daysLeft
}

%% DTO -> CONTROLLER USAGE (DEPENDENCY)
AuthController ..> LoginRequest
AuthController ..> LoginResponse
UserController ..> CreatePmRequest
UserController ..> PmListResponse
UserController ..> UpdateUserRequest
ProjectController ..> CreateProjectRequest
ProjectController ..> ProjectListResponse
ProjectController ..> ProjectResourceDto
ProjectController ..> UpdateProjectRequest
ResourceController ..> CreateResourceRequest
ResourceController ..> UpdateResourceRequest
ResourceController ..> ResourceResponse
ResourceController ..> AssignResourceRequest
ResourceAssignmentController ..> ExtendAssignmentRequest
ResourceAssignmentController ..> ReleaseAssignmentRequest
RequestController ..> ProjectProposalRequest
RequestController ..> AssignResourceRequest
RequestController ..> AssignmentRequestResponse
HistoryLogController ..> HistoryLogResponse
DashboardController ..> DashboardStatsResponse
DashboardController ..> AssignmentEndingSoonResponse
```
