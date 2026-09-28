package pksmatches.model;

import pksmatches.model.enums.UserRole;

import java.util.Objects;

public class User {

    private int id;
    private String username;
    private String passwordHash;
    private UserRole role;

    public User() {
        this.role = UserRole.USER;
    }

    public User(String username, String passwordHash) {
        this();
        setUsername(username);
        setPasswordHash(passwordHash);
    }

    public User(int id, String username, String passwordHash, UserRole role) {
        this(username, passwordHash);
        this.id = id;
        setRole(role);
    }

    public int getId() { return id; }
    public void setId(int id) {
        if (id < 0) throw new IllegalArgumentException("ID не может быть отрицательным");
        this.id = id;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Логин не может быть пустым");
        }
        this.username = username;
    }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Хэш пароля не может быть пустым");
        }
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) {
        if (role == null) {
            throw new IllegalArgumentException("Роль обязательна");
        }
        this.role = role;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return id == user.id && Objects.equals(username, user.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username);
    }

    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', role=" + role + '}';
    }
}