package com.fiao.persistence;

import com.fiao.model.Payment;
import com.fiao.model.PaymentMethod;
import com.fiao.model.PaymentType;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    @Query(value = """
            select p from Payment p join fetch p.createdByUser
            where (:businessId is null or p.business.id = :businessId)
              and (:debtId is null or p.debt.id = :debtId)
              and (:filterType = false or p.type = :type)
              and (:filterMethod = false or p.method = :method)
              and (:search is null or lower(coalesce(p.note, '')) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(p) from Payment p
            where (:businessId is null or p.business.id = :businessId)
              and (:debtId is null or p.debt.id = :debtId)
              and (:filterType = false or p.type = :type)
              and (:filterMethod = false or p.method = :method)
              and (:search is null or lower(coalesce(p.note, '')) like lower(concat('%', :search, '%')))
            """)
    Page<Payment> search(@Param("businessId") String businessId, @Param("debtId") String debtId,
                         @Param("type") PaymentType type, @Param("filterType") boolean filterType,
                         @Param("method") PaymentMethod method, @Param("filterMethod") boolean filterMethod,
                         @Param("search") String search, Pageable pageable);

    List<Payment> findAllByDebtIdOrderByPaymentDateDesc(String debtId);

    List<Payment> findAllByPaymentGroupIdAndType(String paymentGroupId, PaymentType type);

    boolean existsByDebtId(String debtId);

    @Query("select coalesce(sum(case when p.type = :paymentType "
            + "then -p.amount else p.amount end), 0) from Payment p where p.debt.id = :debtId")
    BigDecimal signedMovements(@Param("debtId") String debtId, @Param("paymentType") PaymentType paymentType);
}
