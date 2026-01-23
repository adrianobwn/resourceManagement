package com.resourceManagement.repository;

import com.resourceManagement.model.entity.HistoryLog;
import com.resourceManagement.model.enums.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryLogRepository extends JpaRepository<HistoryLog, Integer> {

    List<HistoryLog> findAllByOrderByTimestampDesc();

    List<HistoryLog> findByPerformedBy_UserIdOrderByTimestampDesc(Integer userId);

    List<HistoryLog> findByEntityTypeOrderByTimestampDesc(EntityType entityType);
}
