package pksmatches.model;

import pksmatches.model.enums.MatchStatus;
import pksmatches.model.enums.TournamentStage;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Матч — основная сущность агрегатора.
 * Соответствует таблице matches.
 */
public class Match {

    private int id;
    private Tournament tournament;       // связь с турниром (FK tournament_id)
    private String team1;
    private String team2;
    private LocalDateTime matchDate;
    private TournamentStage stage;
    private MatchStatus status;
    private int score1;
    private int score2;

    // ---- Конструкторы ----

    public Match() {
        this.status = MatchStatus.SCHEDULED;
    }

    /** Конструктор для нового матча (id ещё не присвоен). */
    public Match(Tournament tournament,
                 String team1,
                 String team2,
                 LocalDateTime matchDate,
                 TournamentStage stage) {
        this();
        setTournament(tournament);
        setTeam1(team1);
        setTeam2(team2);
        setMatchDate(matchDate);
        setStage(stage);
    }

    /** Полный конструктор (например, при загрузке из БД). */
    public Match(int id,
                 Tournament tournament,
                 String team1,
                 String team2,
                 LocalDateTime matchDate,
                 TournamentStage stage,
                 MatchStatus status,
                 int score1,
                 int score2) {
        this(tournament, team1, team2, matchDate, stage);
        this.id = id;
        setStatus(status);
        setScore1(score1);
        setScore2(score2);
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

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        if (tournament == null) {
            throw new IllegalArgumentException("Турнир обязателен");
        }
        this.tournament = tournament;
    }

    public String getTeam1() {
        return team1;
    }

    public void setTeam1(String team1) {
        if (team1 == null || team1.isBlank()) {
            throw new IllegalArgumentException("Название первой команды не может быть пустым");
        }
        if (team2 != null && team1.equalsIgnoreCase(team2)) {
            throw new IllegalArgumentException("Команды должны различаться");
        }
        this.team1 = team1;
    }

    public String getTeam2() {
        return team2;
    }

    public void setTeam2(String team2) {
        if (team2 == null || team2.isBlank()) {
            throw new IllegalArgumentException("Название второй команды не может быть пустым");
        }
        if (team1 != null && team1.equalsIgnoreCase(team2)) {
            throw new IllegalArgumentException("Команды должны различаться");
        }
        this.team2 = team2;
    }

    public LocalDateTime getMatchDate() {
        return matchDate;
    }

    public void setMatchDate(LocalDateTime matchDate) {
        if (matchDate == null) {
            throw new IllegalArgumentException("Дата матча обязательна");
        }
        this.matchDate = matchDate;
    }

    public TournamentStage getStage() {
        return stage;
    }

    public void setStage(TournamentStage stage) {
        if (stage == null) {
            throw new IllegalArgumentException("Этап турнира обязателен");
        }
        this.stage = stage;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Статус матча обязателен");
        }
        this.status = status;
    }

    public int getScore1() {
        return score1;
    }

    public void setScore1(int score1) {
        if (score1 < 0) {
            throw new IllegalArgumentException("Счёт не может быть отрицательным");
        }
        this.score1 = score1;
    }

    public int getScore2() {
        return score2;
    }

    public void setScore2(int score2) {
        if (score2 < 0) {
            throw new IllegalArgumentException("Счёт не может быть отрицательным");
        }
        this.score2 = score2;
    }

    // ---- Бизнес-методы ----

    public boolean isLive() {
        return status == MatchStatus.LIVE;
    }

    public boolean isFinished() {
        return status == MatchStatus.FINISHED;
    }

    public void startLive() {
        if (status != MatchStatus.SCHEDULED) {
            throw new IllegalStateException("Начать можно только запланированный матч");
        }
        this.status = MatchStatus.LIVE;
    }

    public void finish() {
        if (status != MatchStatus.LIVE) {
            throw new IllegalStateException("Завершить можно только идущий матч");
        }
        this.status = MatchStatus.FINISHED;
    }

    // ---- equals / hashCode / toString ----

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Match)) return false;
        Match match = (Match) o;
        return id == match.id;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(id);
    }

    @Override
    public String toString() {
        return "Match{" +
                "id=" + id +
                ", tournament=" + (tournament != null ? tournament.getName() : null) +
                ", team1='" + team1 + '\'' +
                ", team2='" + team2 + '\'' +
                ", matchDate=" + matchDate +
                ", stage=" + stage +
                ", status=" + status +
                ", score=" + score1 + ":" + score2 +
                '}';
    }
}