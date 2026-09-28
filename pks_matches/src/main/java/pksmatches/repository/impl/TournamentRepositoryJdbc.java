package pksmatches.repository.impl;

import pksmatches.model.Tournament;
import pksmatches.repository.TournamentRepository;
import pksmatches.util.DatabaseManager;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TournamentRepositoryJdbc implements TournamentRepository {

    @Override
    public List<Tournament> findAll() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT id, name, start_date, end_date FROM tournaments";
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
    public Optional<Tournament> findById(int id) {
        String sql = "SELECT id, name, start_date, end_date FROM tournaments WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return Optional.empty();
    }

    @Override
    public Tournament save(Tournament tournament) {
        String sql = "INSERT INTO tournaments (name, start_date, end_date) VALUES (?, ?, ?)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, tournament.getName());
            ps.setDate(2, Date.valueOf(tournament.getStartDate()));
            if (tournament.getEndDate() != null) ps.setDate(3, Date.valueOf(tournament.getEndDate()));
            else ps.setNull(3, Types.DATE);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) tournament.setId(keys.getInt(1));
            }
            return tournament;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void update(Tournament tournament) {
        String sql = "UPDATE tournaments SET name = ?, start_date = ?, end_date = ? WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, tournament.getName());
            ps.setDate(2, Date.valueOf(tournament.getStartDate()));
            if (tournament.getEndDate() != null) ps.setDate(3, Date.valueOf(tournament.getEndDate()));
            else ps.setNull(3, Types.DATE);
            ps.setInt(4, tournament.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteById(int id) {
        String sql = "DELETE FROM tournaments WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private Tournament mapRow(ResultSet rs) throws SQLException {
        int id = rs.getInt("id");
        String name = rs.getString("name");
        LocalDate start = rs.getDate("start_date").toLocalDate();
        Date endDate = rs.getDate("end_date");
        LocalDate end = endDate != null ? endDate.toLocalDate() : null;
        return new Tournament(id, name, start, end);
    }
}