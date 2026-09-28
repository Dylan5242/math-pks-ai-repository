package pksmatches.model;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Турнир — связанная сущность для матчей.
 * Соответствует таблице tournaments.
 */
public class Tournament {

    private int id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate; // может быть null, если турнир ещё идёт

    // ---- Конструкторы ----

    public Tournament() {
    }

    public Tournament(String name, LocalDate startDate, LocalDate endDate) {
        setName(name);
        setStartDate(startDate);
        setEndDate(endDate);
    }

    public Tournament(int id, String name, LocalDate startDate, LocalDate endDate) {
        this(name, startDate, endDate);
        this.id = id;
    }

    // ---- Геттеры / сеттеры ----

    public int getId() {
        return id;
    }

    public void setId(int id) {
        if (id < 0) {
            throw new IllegalArgumentException("ID не может быть отрицательным");
        }
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Название турнира не может быть пустым");
        }
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        if (startDate == null) {
            throw new IllegalArgumentException("Дата начала обязательна");
        }
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        if (endDate != null && startDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Дата окончания не может быть раньше даты начала");
        }
        this.endDate = endDate;
    }

    // ---- equals / hashCode / toString ----

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tournament)) return false;
        Tournament that = (Tournament) o;
        return id == that.id && Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }

    @Override
    public String toString() {
        return "Tournament{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}