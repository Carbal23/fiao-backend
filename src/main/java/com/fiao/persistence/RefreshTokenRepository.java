package com.fiao.persistence;

import com.fiao.model.RefreshToken;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    List<RefreshToken> findAllByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(String userId, LocalDateTime now);

    List<RefreshToken> findAllByUserId(String userId);

    void deleteAllByUserIdAndDeviceInfo(String userId, String deviceInfo);

    void deleteAllByUserId(String userId);
}
