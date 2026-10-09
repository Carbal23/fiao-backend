package com.fiao.persistence;

import com.fiao.model.PaymentGroup;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentGroupRepository extends JpaRepository<PaymentGroup, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from PaymentGroup g where g.id = :id")
    Optional<PaymentGroup> findByIdForUpdate(@Param("id") String id);
}
