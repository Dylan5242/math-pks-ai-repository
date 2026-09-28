package pksmatches.repository.impl;

import pksmatches.model.Match;
import pksmatches.model.Tournament;
import pksmatches.model.enums.MatchStatus;
import pksmatches.model.enums.TournamentStage;
import pksmatches.src.main.java.pksmatches.repository.MatchRepository;
import pksmatches.util.DatabaseManager;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class MatchRepositoryJdbc implements MatchRepository {

    private static final String BASE_SELECT =
            "SELECT m.id, m.tournament_id, m.team1, m.team2, m.match_date, " +
                    "m.stage::text AS stage, m.status::text AS status, m.score1, m.score2, " +
                    "t.name AS tournament_name, t.start_date, t.end_date " +
                    "FROM matches m " +
                    "JOIN tournaments t ON m.tournament_id = t.id";

    @Override
    public List<Match> findAll() {
        List<Match> list = new ArrayList<>();
        try (Connection c = DatabaseManager.getConnection();
             Statement st = c.createStatement();
             ResultSet rs = st.executeQuery(BASE_SELECT)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при получении всех матчей", e);
        }
        return list;
    }

    @Override
    public Optional<Match> findById(int id) {
        String sql = BASE_SELECT + " WHERE m.id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при поиске матча по ID", e);
        }
        return Optional.empty();
    }

    @Override
    public List<Match> findByTournamentId(int tournamentId) {
        List<Match> list = new ArrayList<>();
        String sql = BASE_SELECT + " WHERE m.tournament_id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при поиске матчей турнира", e);
        }
        return list;
    }

    @Override
    public List<Match> findByStatus(MatchStatus status) {
        List<Match> list = new ArrayList<>();
        String sql = BASE_SELECT + " WHERE m.status = CAST(? AS matchstatus)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, status.name());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при поиске матчей по статусу", e);
        }
        return list;
    }

    @Override
    public Match save(Match match) {
        String sql = "INSERT INTO matches (tournament_id, team1, team2, match_date, stage, status, score1, score2) " +
                "VALUES (?, ?, ?, ?, CAST(? AS tournamentstage), CAST(? AS matchstatus), ?, ?)";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, match.getTournament().getId());
            ps.setString(2, match.getTeam1());
            ps.setString(3, match.getTeam2());
            ps.setTimestamp(4, Timestamp.valueOf(match.getMatchDate()));
            ps.setString(5, match.getStage().name());
            ps.setString(6, match.getStatus().name());
            ps.setInt(7, match.getScore1());
            ps.setInt(8, match.getScore2());

            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    match.setId(keys.getInt(1));
                }
            }
            return match;
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при сохранении матча", e);
        }
    }

    @Override
    public void update(Match match) {
        String sql = "UPDATE matches SET tournament_id = ?, team1 = ?, team2 = ?, match_date = ?, " +
                "stage = CAST(? AS tournamentstage), status = CAST(? AS matchstatus), " +
                "score1 = ?, score2 = ? WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setInt(1, match.getTournament().getId());
            ps.setString(2, match.getTeam1());
            ps.setString(3, match.getTeam2());
            ps.setTimestamp(4, Timestamp.valueOf(match.getMatchDate()));
            ps.setString(5, match.getStage().name());
            ps.setString(6, match.getStatus().name());
            ps.setInt(7, match.getScore1());
            ps.setInt(8, match.getScore2());
            ps.setInt(9, match.getId());

            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при обновлении матча", e);
        }
    }

    @Override
    public void deleteById(int id) {
        String sql = "DELETE FROM matches WHERE id = ?";
        try (Connection c = DatabaseManager.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Ошибка при удалении матча", e);
        }
    }

    private Match mapRow(ResultSet rs) throws SQLException {
        int id = rs.getInt("id");
        String team1 = rs.getString("team1");
        String team2 = rs.getString("team2");
        LocalDateTime matchDate = rs.getTimestamp("match_date").toLocalDateTime();

        TournamentStage stage = TournamentStage.valueOf(rs.getString("stage"));
        MatchStatus status = MatchStatus.valueOf(rs.getString("status"));

        int score1 = rs.getInt("score1");
        int score2 = rs.getInt("score2");

        int tournamentId = rs.getInt("tournament_id");
        String tournamentName = rs.getString("tournament_name");
        LocalDate startDate = rs.getDate("start_date").toLocalDate();

        Date endDateSql = rs.getDate("end_date");
        LocalDate endDate = (endDateSql != null) ? endDateSql.toLocalDate() : null;

        Tournament tournament = new Tournament(tournamentId, tournamentName, startDate, endDate);
        return new Match(id, tournament, team1, team2, matchDate, stage, status, score1, score2);
    }
}