package pksmatches.service;

import pksmatches.model.Tournament;
import pksmatches.repository.TournamentRepository;

import java.util.List;
import java.util.Optional;

public class TournamentService {
    private final TournamentRepository tournamentRepository;

    public TournamentService(TournamentRepository tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }

    public Tournament add(Tournament tournament) {
        if (tournament == null) throw new IllegalArgumentException("Турнир не может быть null");
        return tournamentRepository.save(tournament);
    }

    public List<Tournament> getAll() {
        return tournamentRepository.findAll();
    }

    public Optional<Tournament> findById(int id) {
        return tournamentRepository.findById(id);
    }

    public Tournament getById(int id) {
        return findById(id).orElseThrow(() -> new IllegalArgumentException("Турнир с ID=" + id + " не найден"));
    }

    public boolean remove(int id) {
        if (tournamentRepository.findById(id).isEmpty()) return false;
        tournamentRepository.deleteById(id);
        return true;
    }
}