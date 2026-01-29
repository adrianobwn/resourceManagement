package com.resourceManagement.repository;

import com.resourceManagement.model.entity.HistoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryLogRepository extends JpaRepository<HistoryLog, Integer> {

    List<HistoryLog> findByPerformedBy_UserIdOrderByTimestampDesc(Integer userId);

    List<HistoryLog> findByEntityTypeOrderByTimestampDesc(String entityType);

    List<HistoryLog> findAllByOrderByTimestampDesc();

    List<HistoryLog> findByPerformedBy_UserIdOrProject_DevMan_UserIdOrderByTimestampDesc(Integer userId,
            Integer devManId);

    List<HistoryLog> findByProject_ProjectId(Integer projectId);

    void deleteByProject_ProjectId(Integer projectId);

    void deleteByResource_ResourceId(Integer resourceId);

    void deleteByPerformedBy_UserId(Integer userId);
}
