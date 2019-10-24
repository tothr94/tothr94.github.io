app.controller("scoreboardCtrl", function ($scope) {
    const POSITION_WIDTH = 150; // helyezés szélessége
    const TEAM_NAME_WIDTH = 400; // csapatok neveinek szélessége
    const SCREEN_WIDTH = 1920; // képernyő szélessége
    const SCREEN_HEIGHT = 1080; // képernyő magassága
    const HEADING_HEIGHT = 50; // címsor magassága
    const NUMBER_OF_TEAMS = 10; // megjelenítendő csapatok száma
    const TEAM_HEIGHT = (SCREEN_HEIGHT - HEADING_HEIGHT) / NUMBER_OF_TEAMS; // egy csapat magassága
    // a státuszok színei
    const COLORS = {
        ACCEPTED: {
            background: "#00C851",
            color: "#ffffff"
        },
        REJECTED: {
            background: "#cc0000",
            color: "#ffffff"
        },
        PARTLY_ACCEPTED: {
            background: "#ff8800",
            color: "#ffffff"
        },
        FROZEN: {
            highlight: '#33b5e5',
            background: "#0099cc",
            color: "#ffffff"
        },
        NOTHING: {
            background: "#242424",
            color: "#ffffff"
        },
        UNIDEB: {
            background: "#004735",
            color: "#ffffff"
        }
    };
    const teamStatuses = {
        FINISHED: 'FINISHED',
        HIGHLIGHT_STARTED: 'HIGHLIGHT_STARTED',
        PROCESS_ENDED: 'PROCESS_ENDED',
        ACTIVE: 'ACTIVE'
    };

    let teamDOM = {};
    let exercises, teams, contestData, activeTeam = -1;
    let transitionInProgress = false;

    function loadExercises() {
        return fetch('data/exercises.json')
            .then(response => response.json());
    }

    function loadTeams() {
        return fetch('data/teams.json')
            .then(response => response.json());
    }

    function loadContestData() {
        return fetch('data/contestData.json')
            .then(response => response.json());
    }

    function highlightTeam(dom) {
        [dom.teamNameRect, dom.positionRect].forEach(element => element
            .transition()
            .duration(300)
            .attr('fill', COLORS.UNIDEB.background)
        );
        [dom.teamNameText, dom.positionText, dom.schoolText, dom.contestantsText, dom.timeText, dom.resultsText].forEach(element => element
            .transition()
            .duration(300)
            .attr('fill', COLORS.UNIDEB.color)
        );
    }

    function unHighlightTeam(dom) {
        [dom.teamNameRect, dom.positionRect].forEach(element => element
            .transition()
            .duration(300)
            .attr('fill', '#fff')
        );
        [dom.teamNameText, dom.positionText, dom.schoolText, dom.contestantsText, dom.timeText, dom.resultsText].forEach(element => element
            .transition()
            .duration(300)
            .attr('fill', '#000')
        );
    }

    document.onkeydown = function (e) {
        if (transitionInProgress || e.code != 'ArrowRight') {
            return;
        }

        let teamIndex = -1;
        for (let i = teams.length - 1; i >= 0; i--) {
            if (teams[i].status !== teamStatuses.FINISHED) {
                teamIndex = i;
                break;
            }
        }

        // ha már nincs módosítás
        if (teamIndex === -1) {
            return;
        }

        const team = teams[teamIndex];
        if (team.status === teamStatuses.ACTIVE) {
            highlightTeam(teamDOM[team.name]);
            team.status = teamStatuses.HIGHLIGHT_STARTED;
            const teamData = contestData[team.name];
            const unFinishedExercises = [];
            exercises.priority.forEach(i => {
                if (!teamData.finalData[i].finished) {
                    unFinishedExercises.push(i);
                }
            });

            if (!unFinishedExercises.length) {
                team.status = teamStatuses.PROCESS_ENDED;
            } else {
                teamDOM[team.name].exercises[unFinishedExercises[0]].rect
                    .transition()
                    .duration(300)
                    .attr('fill', COLORS.FROZEN.highlight);
            }
        } else if (team.status === teamStatuses.PROCESS_ENDED) {
            unHighlightTeam(teamDOM[team.name]);
            team.status = teamStatuses.FINISHED;
        } else if (team.status === teamStatuses.HIGHLIGHT_STARTED) {
            const teamData = contestData[team.name];
            const unFinishedExercises = [];
            exercises.priority.forEach(i => {
                if (!teamData.finalData[i].finished) {
                    unFinishedExercises.push(i);
                }
            });

            if (!unFinishedExercises.length) {
                team.status = teamStatuses.PROCESS_ENDED;
                return;
            }

            const exerciseIndex = unFinishedExercises[0];

            const count = teamData.frozenData[exerciseIndex].count + teamData.finalData[exerciseIndex].count;
            const time = teamData.finalData[exerciseIndex].status === 'ACCEPTED' ? teamData.frozenData[exerciseIndex].time + teamData.finalData[exerciseIndex].time : 0;
            if (teamData.frozenData[exerciseIndex].status === 'UNKNOWN') {
                team.tried++;
            }

            teamData.finalData[exerciseIndex].finished = true;
            if (teamData.finalData[exerciseIndex].status === 'ACCEPTED') {
                if (teamData.frozenData[exerciseIndex].status === 'PARTLY_ACCEPTED') {
                    team.partly_solved--;
                }
                team.solved++;
                team.time += time;
            } else if (teamData.finalData[exerciseIndex].status === 'PARTLY_ACCEPTED' && teamData.frozenData[exerciseIndex].status !== 'PARTLY_ACCEPTED') {
                team.partly_solved++;
            }

            sortTeams();
            teamDOM[team.name].resultsText
                .text(team.solved + " + " + team.partly_solved);
            teamDOM[team.name].timeText
                .text(Math.floor(team.time / 60) + ":" + Math.ceil(team.time % 60).pad(2));

            teamDOM[team.name].group.raise();
            transitionInProgress = true;
            setTimeout(function () {
                transitionInProgress = false;
            }, team.position === team.lastPosition ? 1500 : 4000);
            if (team.lastPosition !== team.position) {
                teamDOM[team.name].positionRect
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS['ACCEPTED'].background)
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS.UNIDEB.background)
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS['ACCEPTED'].background)
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS.UNIDEB.background)
            }

            teamDOM[team.name].exercises[exerciseIndex].rect
                .transition()
                .duration(1000)
                .attr('fill', COLORS[teamData.finalData[exerciseIndex].status].background);

            teamDOM[team.name].exercises[exerciseIndex].count
                .transition()
                .duration(0)
                .text('')
                .transition()
                .duration(500)
                .transition()
                .text(count);

            teamDOM[team.name].exercises[exerciseIndex].time
                .transition()
                .duration(0)
                .text('')
                .transition()
                .duration(500)
                .transition()
                .text(time === 0 ? '' : Math.floor(time / 60) + ":" + Math.ceil(time % 60).pad(2));

            if (team.lastPosition !== team.position) {
                setTimeout(rearrangeTeams.bind(null, team.position), 1500);
                team.status = teamStatuses.ACTIVE;
            } else if (unFinishedExercises.length > 1) {
                teamDOM[team.name].exercises[unFinishedExercises[1]].rect
                    .transition()
                    .duration(500)
                    .transition()
                    .duration(300)
                    .attr('fill', COLORS.FROZEN.highlight);
            }
        }
    }

    function sortTeams() {
        teams.sort((a, b) => {
            if (a.solved !== b.solved) {
                return b.solved - a.solved;
            }

            if (a.partly_solved !== b.partly_solved) {
                return b.partly_solved - a.partly_solved;
            }

            if (a.time !== b.time) {
                return a.time - b.time;
            }

            const aFirstSolved = a.solved === a.frozenSolved ? a.frozenFirstAcceptedTime : a.finalFirstAcceptedTime;
            const bFirstSolved = b.solved === b.frozenSolved ? b.frozenFirstAcceptedTime : b.finalFirstAcceptedTime;
            if (aFirstSolved !== bFirstSolved) {
                return aFirstSolved - bFirstSolved;
            }
            return b.tried - a.tried;
        });

        for (let i = 0; i < teams.length; i++) {
            teams[i].lastPosition = teams[i].position;
            teams[i].position = i;
        }
    }

    function rearrangeTeams(selectedPosition) {
        teams.forEach(team => {
            teamDOM[team.name].positionText
                .text(team.position + 1);

            setTimeout(unHighlightTeam.bind(null, teamDOM[team.name]), 2000);
            teamDOM[team.name].elements.forEach(element => {
                    const offsetY = element.attr('y') - (HEADING_HEIGHT + team.lastPosition * TEAM_HEIGHT);

                    if (team.position === selectedPosition) {
                        element
                            .transition()
                            .duration(1700)
                            .attr('y', HEADING_HEIGHT + team.position * TEAM_HEIGHT + offsetY);
                    } else {
                        element
                            .transition()
                            .duration(2000)
                            .attr('y', HEADING_HEIGHT + team.position * TEAM_HEIGHT + offsetY);
                    }
                }
            )
        })
    }


    $scope.init = function () {
        $scope.dataType = 'sets';
        $scope.useLog = $scope.useWeight = $scope.useSort = false;
        $scope.stacked = $scope.loading = true;
        Promise.all([
            loadExercises(),
            loadTeams(),
            loadContestData()
        ]).then(res => {
                exercises = res[0];
                teams = res[1];
                contestData = res[2];

                // csapatok előfeldolgozása
                teams.forEach(team => {
                    team.status = teamStatuses.ACTIVE;
                    team.solved = 0;
                    team.frozenSolved = 0;
                    team.partly_solved = 0;
                    team.time = 0;
                    team.tried = 0;

                    contestData[team.name].frozenData.forEach(exercise => {
                        if (exercise.status === 'ACCEPTED') {
                            team.solved++;
                            team.frozenSolved++;
                            team.time += exercise.time;
                        } else if (exercise.status === 'PARTLY_ACCEPTED') {
                            team.partly_solved++;
                        }

                        if (exercise.count > 0) {
                            team.tried++;
                        }
                    });

                    contestData[team.name].finalData.forEach(exercise => {
                        if (exercise.count != 0) {
                            exercise.finished = false;
                        } else {
                            exercise.finished = true;
                        }
                    });
                });

                // csapatok rendezése
                sortTeams();
                $scope.reInit();
            }
        );
    }

    $scope.reInit = function () {
        d3.selectAll("svg").remove();
        drawHeading();
        drawScoreboard();
        $scope.selected = undefined;
    };

    function drawHeading() {
        const container = d3.select("#scoreboard-heading")
            .append("svg")
            .style("width", SCREEN_WIDTH)
            .style("height", HEADING_HEIGHT)
            .attr('fill', '#00bbf1')
            .attr('viewBox', '0 0 ' + SCREEN_WIDTH + ' ' + HEADING_HEIGHT);


        // pozíció téglalapja
        container.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', POSITION_WIDTH)
            .attr('height', HEADING_HEIGHT)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', COLORS.UNIDEB.background);

        // pozíció szövege
        container.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', COLORS.UNIDEB.color)
            .text('#');

        // csapatnév téglalapja
        container.append('rect')
            .attr('x', POSITION_WIDTH)
            .attr('y', 0)
            .attr('width', TEAM_NAME_WIDTH)
            .attr('height', HEADING_HEIGHT)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', COLORS.UNIDEB.background);

        // csapatnév szövege
        container.append('text')
            .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', COLORS.UNIDEB.color)
            .text('Csapatnév');

        const exerciseWidth = (SCREEN_WIDTH - TEAM_NAME_WIDTH - POSITION_WIDTH) / exercises.data.length;

        let offsetX = TEAM_NAME_WIDTH + POSITION_WIDTH;
        exercises.data.forEach(exercise => {
            drawExerciseHeading(exercise, offsetX, exerciseWidth, container);
            offsetX += exerciseWidth;
        });
    }

    function drawScoreboard() {
        const exerciseWidth = (SCREEN_WIDTH - TEAM_NAME_WIDTH - POSITION_WIDTH) / exercises.data.length;
        const totalHeight = ((SCREEN_HEIGHT - HEADING_HEIGHT) / NUMBER_OF_TEAMS) * teams.length;
        const container = d3.select("#scoreboard-body")
            .append("svg")
            .style("width", SCREEN_WIDTH)
            .style("height", totalHeight)
            .attr('fill', '#00bbf1')
            .attr('viewBox', '0 0 ' + SCREEN_WIDTH + ' ' + totalHeight);

        let offsetY = 0;
        teams.forEach(team => {
            drawTeam(team, offsetY, TEAM_HEIGHT, exerciseWidth, container);
            offsetY += TEAM_HEIGHT;
        });
    }

    Number.prototype.pad = function (size) {
        var s = String(this);
        while (s.length < (size || 2)) {
            s = "0" + s;
        }
        return s;
    }

    function drawTeam(team, offsetY, teamHeight, exerciseWidth, container) {
        const group = container.append("g");
        const elements = [];
        const teamDomEntry = {};
        teamDomEntry.group = group;

        // pozíció téglalapja
        const positionRect = group.append('rect')
            .attr('x', 0)
            .attr('y', offsetY)
            .attr('width', POSITION_WIDTH)
            .attr('height', teamHeight)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', "#fff");

        elements.push(positionRect);
        teamDomEntry.positionRect = positionRect;

        // pozíció szövege
        const positionText = group.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', '#1a1a1a')
            .text(team.position + 1);
        elements.push(positionText);
        teamDomEntry.positionText = positionText;

        const resultsText = group.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT * 1.2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 3)
            .attr('fill', '#1a1a1a')
            .text(team.solved + " + " + team.partly_solved);
        elements.push(resultsText);
        teamDomEntry.resultsText = resultsText;

        const timeText = group.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT * 1.6)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 3)
            .attr('fill', '#1a1a1a')
            .text(Math.floor(team.time / 60) + ':' + Math.ceil(team.time % 60).pad(2));
        elements.push(timeText);
        teamDomEntry.timeText = timeText;

        // téglalap
        const teamNameRect = group.append('rect')
            .attr('x', POSITION_WIDTH)
            .attr('y', offsetY)
            .attr('width', TEAM_NAME_WIDTH)
            .attr('height', teamHeight)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', "#fff");
        elements.push(teamNameRect);
        teamDomEntry.teamNameRect = teamNameRect;


        // csapatnév
        const teamNameText = group.append('text')
            .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', '#1a1a1a')
            .text(team.name);
        elements.push(teamNameText);
        teamDomEntry.teamNameText = teamNameText;

        // csapatnév
        const schoolText = group.append('text')
            .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT * 1.2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 3)
            .attr('fill', '#1a1a1a')
            .text(team.school);
        elements.push(schoolText);
        teamDomEntry.schoolText = schoolText;

        // csapatnév
        const contestantsText = group.append('text')
            .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
            .attr('y', offsetY + HEADING_HEIGHT * 1.6)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 3)
            .attr('fill', '#1a1a1a')
            .text(team.contestants ? team.contestants.join(', ') : '');
        elements.push(contestantsText);
        teamDomEntry.contestantsText = contestantsText;


        let offsetX = TEAM_NAME_WIDTH + POSITION_WIDTH;
        teamDomEntry.exercises = [];
        for (let i = 0; i < exercises.data.length; i++) {
            let exerciseDOM = {};
            exerciseDOM.elements = [];

            const frozenData = contestData[team.name].frozenData;
            const finalData = contestData[team.name].finalData;
            let text = frozenData[i].count;
            let frozen = false;
            if (finalData[i].count > 0) {
                text += ' + ' + finalData[i].count;
                frozen = true;
            }


            const statuses = ['ACCEPTED', 'REJECTED', 'PARTLY_ACCEPTED', 'FROZEN', 'EMPTY'];
            const color = COLORS[frozen ? 'FROZEN' : frozenData[i].status];
            const rect = group.append('rect')
                .attr('x', offsetX)
                .attr('y', offsetY)
                .attr('width', exerciseWidth)
                .attr('height', teamHeight)
                .attr('stroke', '#000')
                .style('stroke-width', 2)
                .attr('fill', color.background);

            elements.push(rect)
            exerciseDOM.elements.push(rect);
            exerciseDOM.rect = rect;

            const countText = group.append('text')
                .attr('x', offsetX + exerciseWidth / 2)
                .attr('y', offsetY + teamHeight / 2 - HEADING_HEIGHT / 4)
                .attr('alignment-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('font-size', HEADING_HEIGHT / 2)
                .attr('fill', color.color)
                .text(text !== 0 ? text : '');
            elements.push(countText);
            exerciseDOM.elements.push(countText);
            exerciseDOM.count = countText;

            const timeText = group.append('text')
                .attr('x', offsetX + exerciseWidth / 2)
                .attr('y', offsetY + teamHeight / 2 + HEADING_HEIGHT / 4)
                .attr('alignment-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('font-size', HEADING_HEIGHT / 3)
                .attr('fill', color.color)
                .text(frozenData[i].status == 'ACCEPTED' ? Math.floor(frozenData[i].time / 60) + ":" + Math.ceil(frozenData[i].time % 60).pad(2) : '');
            elements.push(timeText);
            exerciseDOM.elements.push(timeText);
            exerciseDOM.time = timeText;

            teamDomEntry.exercises.push(exerciseDOM);
            offsetX += exerciseWidth;
        }

        teamDomEntry.elements = elements;
        teamDOM[team.name] = teamDomEntry;
    }

    /**
     * Egy feladat fejlécét rajzoló függvény.
     * @param exercise a feladat
     * @param offsetX az offset
     * @param size a szélesség
     * @param container szülő
     */
    function drawExerciseHeading(exercise, offsetX, size, container) {
        // téglalap
        container.append('rect')
            .attr('x', offsetX)
            .attr('y', 0)
            .attr('width', size)
            .attr('height', HEADING_HEIGHT)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', exercise.background);

        // betűjel
        container.append('text')
            .attr('x', offsetX + size / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', exercise.color ? exercise.color : '#000')
            .text(exercise.id);
    }
});
