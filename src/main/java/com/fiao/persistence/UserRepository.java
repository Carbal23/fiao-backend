package com.fiao.persistence;

import com.fiao.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {
    @Query("select u from User u where (:email is not null and u.email = :email) "
            + "or (:phone is not null and u.phone = :phone) "
            + "or (:documentNumber is not null and u.documentNumber = :documentNumber)")
    Optional<User> findExisting(@Param("email") String email, @Param("phone") String phone,
                                @Param("documentNumber") String documentNumber);

    List<User> findAllByInactivatedAtIsNullOrderByCreatedAtDesc();

    @Query("select u from User u where (:documentNumber is not null and u.documentNumber = :documentNumber) "
            + "or (:phone is not null and u.phone = :phone)")
    Optional<User> findMatchingDebtor(@Param("documentNumber") String documentNumber, @Param("phone") String phone);

    @Query("select u from User u where (u.email = :identifier or u.phone = :identifier "
            + "or u.documentNumber = :identifier) and u.inactivatedAt is null")
    Optional<User> findActiveByIdentifier(@Param("identifier") String identifier);

    @Modifying
    @Query("update Debtor d set d.user = :user where d.user is null and "
            + "(d.documentNumber = :documentNumber or d.phone = :phone)")
    int attachMatchingDebtors(@Param("user") User user, @Param("documentNumber") String documentNumber,
                              @Param("phone") String phone);
}
