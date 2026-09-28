package pksmatches.repository.impl;

import pksmatches.model.User;
import pksmatches.model.enums.UserRole;
import pksmatches.repository.UserRepository;
import pksmatches.util.DatabaseManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserRepositoryJdbc implements UserRepository {

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT id, username, password_hash, role FROM users WHERE LOWER(username) = LOWER(?)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT id, username, password_hash, role FROM users";
        try (Connection c = DatabaseManager.getConnection();
             Statement st = c.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return list;
    }

    @Override
    public User save(User user) {
        String sql = "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getPasswordHash());
            ps.setString(3, user.getRole().name());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) user.setId(keys.getInt(1));
            }
            return user;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void update(User user) {
        String sql = "UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getPasswordHash());
            ps.setString(3, user.getRole().name());
            ps.setInt(4, user.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteByUsername(String username) {
        String sql = "DELETE FROM users WHERE LOWER(username) = LOWER(?)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        int id = rs.getInt("id");
        String username = rs.getString("username");
        String passwordHash = rs.getString("password_hash");
        UserRole role = UserRole.valueOf(rs.getString("role"));
        return new User(id, username, passwordHash, role);
    }
}