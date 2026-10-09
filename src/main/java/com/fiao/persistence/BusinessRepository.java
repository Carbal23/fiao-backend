package com.fiao.persistence;

import com.fiao.model.Business;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusinessRepository extends JpaRepository<Business, String> {
    List<Business> findAllByOwnerIdOrderByCreatedAtDesc(String ownerId);

    @Query("select b from Business b join b.businessUsers bu where bu.user.id = :userId order by bu.createdAt desc")
    List<Business> findWorkingBusinesses(@Param("userId") String userId);

    @Query(value = """
            select b from Business b
            where (b.owner.id = :userId or exists
              (select bu.id from BusinessUser bu where bu.business = b and bu.user.id = :userId))
              and (:search is null or lower(b.name) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(b) from Business b
            where (b.owner.id = :userId or exists
              (select bu.id from BusinessUser bu where bu.business = b and bu.user.id = :userId))
              and (:search is null or lower(b.name) like lower(concat('%', :search, '%')))
            """)
    Page<Business> findVisibleToUser(@Param("userId") String userId, @Param("search") String search, Pageable pageable);

    Optional<Business> findByIdAndInactivatedAtIsNull(String id);

}
