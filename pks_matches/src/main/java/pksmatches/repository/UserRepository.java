package pksmatches.repository;

import pksmatches.model.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByUsername(String username);
    List<User> findAll();
    User save(User user);
    void update(User user);
    void deleteByUsername(String username);
}