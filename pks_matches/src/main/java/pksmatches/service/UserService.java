package pksmatches.service;

import pksmatches.model.User;
import pksmatches.model.enums.UserRole;
import pksmatches.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String username, String password, UserRole role) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Пользователь с таким логином уже существует");
        }
        User user = new User(username, hash(password));
        user.setRole(role == null ? UserRole.USER : role);
        return userRepository.save(user);
    }

    public User authenticate(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getPasswordHash().equals(hash(password)))
                .orElse(null);
    }

    public Optional<User> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return userRepository.findByUsername(username);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public boolean remove(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isEmpty()) return false;
        userRepository.deleteByUsername(username);
        return true;
    }

    private String hash(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Ошибка алгоритма хэширования SHA-256", e);
        }
    }
}
