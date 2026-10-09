package com.fiao.persistence;

import com.fiao.model.Debt;
import com.fiao.model.DebtStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DebtRepository extends JpaRepository<Debt, String> {
    List<Debt> findAllByDebtorIdOrderByCreatedAtDesc(String debtorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Debt d where d.id = :id")
    Optional<Debt> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Debt d where d.debtor.id = :debtorId and d.business.id = :businessId "
            + "and d.status in (:openStatus, :partialStatus) "
            + "order by d.createdAt asc")
    List<Debt> findOpenForDebtorForUpdate(@Param("debtorId") String debtorId,
                                          @Param("businessId") String businessId,
                                          @Param("openStatus") DebtStatus openStatus,
                                          @Param("partialStatus") DebtStatus partialStatus);

    @Query(value = """
            select d from Debt d
            where (:businessId is null or d.business.id = :businessId)
              and (:debtorId is null or d.debtor.id = :debtorId)
              and (:filterStatus = false or d.status = :status)
              and (:search is null or lower(coalesce(d.description, '')) like lower(concat('%', :search, '%')))
              and (:overdue is null or :overdue = false or
                (d.dueDate < :now and d.status in (:openStatus, :partialStatus)))
            """,
            countQuery = """
            select count(d) from Debt d
            where (:businessId is null or d.business.id = :businessId)
              and (:debtorId is null or d.debtor.id = :debtorId)
              and (:filterStatus = false or d.status = :status)
              and (:search is null or lower(coalesce(d.description, '')) like lower(concat('%', :search, '%')))
              and (:overdue is null or :overdue = false or
                (d.dueDate < :now and d.status in (:openStatus, :partialStatus)))
            """)
    Page<Debt> search(@Param("businessId") String businessId, @Param("debtorId") String debtorId,
                      @Param("status") DebtStatus status, @Param("filterStatus") boolean filterStatus,
                      @Param("search") String search,
                      @Param("overdue") Boolean overdue, @Param("now") LocalDateTime now,
                      @Param("openStatus") DebtStatus openStatus, @Param("partialStatus") DebtStatus partialStatus,
                      Pageable pageable);

    long countByIdAndBusinessId(String id, String businessId);

    long countByBusinessIdAndStatusNotIn(String businessId, List<DebtStatus> excludedStatuses);
}
