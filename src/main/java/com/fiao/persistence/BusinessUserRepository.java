package com.fiao.persistence;

import com.fiao.model.BusinessUser;
import com.fiao.model.BusinessUserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusinessUserRepository extends JpaRepository<BusinessUser, String> {
    Optional<BusinessUser> findByBusinessIdAndUserId(String businessId, String userId);

    boolean existsByBusinessIdAndUserId(String businessId, String userId);

    List<BusinessUser> findAllByBusinessIdOrderByCreatedAtAsc(String businessId);

    @Query(value = """
            select bu from BusinessUser bu join fetch bu.user u
            where bu.business.id = :businessId and
              (:search is null or lower(u.firstName) like lower(concat('%', :search, '%'))
               or lower(u.lastName) like lower(concat('%', :search, '%'))
               or lower(u.email) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(bu) from BusinessUser bu join bu.user u
            where bu.business.id = :businessId and
              (:search is null or lower(u.firstName) like lower(concat('%', :search, '%'))
               or lower(u.lastName) like lower(concat('%', :search, '%'))
               or lower(u.email) like lower(concat('%', :search, '%')))
            """)
    Page<BusinessUser> findMembers(@Param("businessId") String businessId, @Param("search") String search,
                                   Pageable pageable);

    Optional<BusinessUser> findByBusinessIdAndUserIdAndRole(String businessId, String userId, BusinessUserRole role);
}
