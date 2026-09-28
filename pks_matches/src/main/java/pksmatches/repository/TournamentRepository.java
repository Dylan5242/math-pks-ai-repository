package pksmatches.repository;

import pksmatches.model.Tournament;
import java.util.List;
import java.util.Optional;

public interface TournamentRepository {
    List<Tournament> findAll();
    Optional<Tournament> findById(int id);
    Tournament save(Tournament tournament);
    void update(Tournament tournament);
    void deleteById(int id);
}