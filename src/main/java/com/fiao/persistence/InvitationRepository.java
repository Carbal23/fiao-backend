package com.fiao.persistence;

import com.fiao.model.Invitation;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvitationRepository extends JpaRepository<Invitation, String> {
    Optional<Invitation> findByCode(String code);

    @Query(value = """
            select i from Invitation i left join fetch i.debtor d
            where i.business.id = :businessId and
              (:search is null or lower(i.code) like lower(concat('%', :search, '%'))
               or lower(coalesce(i.email, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(i.phone, '')) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(i) from Invitation i
            where i.business.id = :businessId and
              (:search is null or lower(i.code) like lower(concat('%', :search, '%'))
               or lower(coalesce(i.email, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(i.phone, '')) like lower(concat('%', :search, '%')))
            """)
    Page<Invitation> search(@Param("businessId") String businessId, @Param("search") String search, Pageable pageable);
}
