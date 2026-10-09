package com.fiao.persistence;

import com.fiao.model.Debtor;
import com.fiao.model.DebtStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DebtorRepository extends JpaRepository<Debtor, String> {
    @Query("select d from Debtor d where d.business.id = :businessId and "
            + "((:documentNumber is not null and d.documentNumber = :documentNumber) or "
            + "(:phone is not null and d.phone = :phone))")
    Optional<Debtor> findExisting(@Param("businessId") String businessId,
                                  @Param("documentNumber") String documentNumber, @Param("phone") String phone);

    Optional<Debtor> findByIdAndBusinessId(String id, String businessId);

    List<Debtor> findAllByBusinessIdAndInactivatedAtIsNull(String businessId);

    List<Debtor> findAllByUserId(String userId);

    @Query(value = """
            select d from Debtor d
            where d.inactivatedAt is null
              and (:businessId is null or d.business.id = :businessId)
              and (:userId is null or exists
                (select bu.id from BusinessUser bu where bu.business = d.business and bu.user.id = :userId))
              and (:search is null or lower(d.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(d.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(d.documentNumber, '')) like lower(concat('%', :search, '%')))
              and (:hasDebt is null or
                (:hasDebt = true and exists (select debt.id from Debt debt where debt.debtor = d
                  and debt.status in (:openStatus, :partialStatus)
                  and debt.balance > 0)) or
                (:hasDebt = false and not exists (select debt.id from Debt debt where debt.debtor = d
                  and debt.status in (:openStatus, :partialStatus)
                  and debt.balance > 0)))
            """,
            countQuery = """
            select count(d) from Debtor d
            where d.inactivatedAt is null
              and (:businessId is null or d.business.id = :businessId)
              and (:userId is null or exists
                (select bu.id from BusinessUser bu where bu.business = d.business and bu.user.id = :userId))
              and (:search is null or lower(d.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(d.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(d.documentNumber, '')) like lower(concat('%', :search, '%')))
              and (:hasDebt is null or
                (:hasDebt = true and exists (select debt.id from Debt debt where debt.debtor = d
                  and debt.status in (:openStatus, :partialStatus)
                  and debt.balance > 0)) or
                (:hasDebt = false and not exists (select debt.id from Debt debt where debt.debtor = d
                  and debt.status in (:openStatus, :partialStatus)
                  and debt.balance > 0)))
            """)
    Page<Debtor> search(@Param("businessId") String businessId, @Param("userId") String userId,
                        @Param("search") String search, @Param("hasDebt") Boolean hasDebt,
                        @Param("openStatus") DebtStatus openStatus, @Param("partialStatus") DebtStatus partialStatus,
                        Pageable pageable);

    @Query("select count(debt) > 0 from Debt debt where debt.debtor.id = :debtorId "
            + "and debt.status in (:openStatus, :partialStatus) "
            + "and debt.balance > 0")
    boolean hasPendingDebt(@Param("debtorId") String debtorId, @Param("openStatus") DebtStatus openStatus,
                           @Param("partialStatus") DebtStatus partialStatus);

    @Query("select coalesce(sum(debt.balance), 0) from Debt debt where debt.debtor.id = :debtorId "
            + "and debt.status in (:openStatus, :partialStatus)")
    java.math.BigDecimal pendingBalance(@Param("debtorId") String debtorId, @Param("openStatus") DebtStatus openStatus,
                                        @Param("partialStatus") DebtStatus partialStatus);

    @Query("select count(d) from Debtor d where d.business.id = :businessId and d.inactivatedAt is null")
    long countActiveByBusiness(@Param("businessId") String businessId);

    @Query("select coalesce(sum(debt.balance), 0) from Debt debt where debt.business.id = :businessId "
            + "and debt.status in (:openStatus, :partialStatus) "
            + "and debt.balance > 0 and debt.debtor.inactivatedAt is null")
    java.math.BigDecimal pendingBalanceByBusiness(@Param("businessId") String businessId,
                                                   @Param("openStatus") DebtStatus openStatus,
                                                   @Param("partialStatus") DebtStatus partialStatus);

    @Query("select count(distinct d.id) from Debtor d join d.debts debt where d.business.id = :businessId "
            + "and d.inactivatedAt is null and debt.status in (:openStatus, :partialStatus) and debt.balance > 0")
    long countWithDebt(@Param("businessId") String businessId, @Param("openStatus") DebtStatus openStatus,
                       @Param("partialStatus") DebtStatus partialStatus);

    @Query("select d, sum(debt.balance) from Debtor d join d.debts debt where d.business.id = :businessId "
            + "and d.inactivatedAt is null and debt.status in (:openStatus, :partialStatus) "
            + "group by d order by sum(debt.balance) desc")
    List<Object[]> findTopWithBalance(@Param("businessId") String businessId, @Param("openStatus") DebtStatus openStatus,
                                      @Param("partialStatus") DebtStatus partialStatus, Pageable pageable);
}
