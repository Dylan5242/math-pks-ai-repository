package pksmatches.src.main.java.pksmatches.repository;

import pksmatches.model.Match;
import pksmatches.model.enums.MatchStatus;
import java.util.List;
import java.util.Optional;

public interface MatchRepository {
    List<Match> findAll();
    Optional<Match> findById(int id);
    List<Match> findByTournamentId(int tournamentId);
    List<Match> findByStatus(MatchStatus status);
    Match save(Match match);
    void update(Match match);
    void deleteById(int id);
}