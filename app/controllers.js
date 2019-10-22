app.controller("scoreboardCtrl", function ($scope) {
    const colorOrder = [
        1, 49, 99, 86, 9, 10, 85, 11, 59, 5, 27, 25, 26, 58, 88, 8, 120, 69, 2, 90, 28, 150, 91, 106, 160, 29, 68, 165,
        4, 31, 110, 32, 96, 161, 3, 103, 33, 35, 158, 166, 76, 34, 155, 80, 6, 36, 37, 38, 48, 39, 40, 41, 152, 63, 7,
        153, 156, 42, 72, 105, 62, 87, 55, 97, 109, 43, 73, 44, 89, 24, 93, 157, 154, 54, 71, 47, 94, 104, 23, 56
    ];

    const TEAM_NAME_WIDTH = 400;
    const SCREEN_WIDTH = 1920;
    const SCREEN_HEIGHT = 1080;
    const HEADING_HEIGHT = 50;
    const NUMBER_OF_TEAMS = 13;
    const POSITION_WIDTH = 80;
    let TEAM_HEIGHT = (SCREEN_HEIGHT - HEADING_HEIGHT) / NUMBER_OF_TEAMS;
    const COLORS = {
        ACCEPTED: {
            background: "#00c851",
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
            background: "#0099cc",
            color: "#ffffff"
        },
        NOTHING: {
            background: "#242424",
            color: "#ffffff"
        }
    };

    let teamDOM = {};

    let exercises, teams, contestData, produced, actual, hidden = [];
    let onTransition = false;

    function watchVariable(name) {
        $scope.$watch(name, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.reInit();
            }
        });
    }

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


    function setZIndexes() {
        teams.forEach(team => {
            teamDOM[team.name].elements.forEach(element => {
                const newIndex = element.attr('z-index') / team.lastPosition * team.position;
                element.attr('z-index', newIndex);
            })
        })
    }

    document.onkeydown = function (e) {
        if (onTransition) {
            return;
        }
        if (e.code == 'ArrowRight') {
            let teamIndex = -1;
            for (let i = teams.length - 1; i >= 0; i--) {
                if (!teams[i].finished) {
                    teamIndex = i;
                    break;
                }
            }
            // ha már nincs módosítás
            if (teamIndex === -1) {
                return;
            }

            const team = teams[teamIndex];
            const teamData = contestData[team.name];
            const unFinishedExercises = [];
            for (let i = 0; i < exercises.length; i++) {
                if (!teamData.finalData[i].finished) {
                    unFinishedExercises.push(i);
                }
            }
            const exerciseIndex = unFinishedExercises[0];

            const count = teamData.frozenData[exerciseIndex].count + teamData.finalData[exerciseIndex].count;
            const time = teamData.finalData[exerciseIndex].status === 'ACCEPTED' ? teamData.frozenData[exerciseIndex].time + teamData.finalData[exerciseIndex].time : 0;
            if (teamData.frozenData[exerciseIndex].status === 'UNKNOWN') {
                team.tried++;
            }

            teamData.finalData[exerciseIndex].finished = true;
            if (unFinishedExercises.length === 1) {
                teams[teamIndex].finished = true;
            }

            if (teamData.finalData[exerciseIndex].status === 'ACCEPTED') {
                team.solved++;
                team.time += teamData.finalData[exerciseIndex].time;
            } else if (teamData.finalData[exerciseIndex].status === 'PARTLY_ACCEPTED') {
                team.partly_solved++;
            }

            sortTeams();

            onTransition = true;
            setTimeout(function () {
                onTransition = false;
            }, team.position === team.lastPosition ? 1500 : 4000);

            if (team.lastPosition !== team.position) {
                teamDOM[team.name].positionRect
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS['ACCEPTED'].background)
                    .transition()
                    .duration(200)
                    .attr('fill', "#fff")
                    .transition()
                    .duration(200)
                    .attr('fill', COLORS['ACCEPTED'].background)
                    .transition()
                    .duration(200)
                    .attr('fill', "#fff")
            }

            // const originalY = element.attr('y');
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
                setZIndexes();
                setTimeout(rearrangeTeams, 1500);
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

            console.log(b.tried + " " + a.tried)
            return b.tried - a.tried;
        });

        for (let i = 0; i < teams.length; i++) {
            teams[i].lastPosition = teams[i].position;
            teams[i].position = i;
        }
    }

    function rearrangeTeams() {
        teams.forEach(team => {
            teamDOM[team.name].positionText
                .text(team.position + 1);
            teamDOM[team.name].elements.forEach(element => {
                    const offsetY = element.attr('y') - (HEADING_HEIGHT + team.lastPosition * TEAM_HEIGHT);

                    element
                        .transition()
                        .duration(2000)
                        .attr('y', HEADING_HEIGHT + team.position * TEAM_HEIGHT + offsetY);
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
                    team.finished = true;
                    team.solved = 0;
                    team.partly_solved = 0;
                    team.time = 0;
                    team.tried = 0;

                    contestData[team.name].frozenData.forEach(exercise => {
                        if (exercise.status === 'ACCEPTED') {
                            team.solved++;
                            team.time += exercise.time;
                        } else if (exercise.status === 'PARTLY_SOLVED') {
                            team.partly_solved++;
                        }

                        if (exercise.count > 0) {
                            team.tried++;
                        }
                    });

                    contestData[team.name].finalData.forEach(exercise => {
                        if (exercise.count != 0) {
                            team.finished = false;
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
            .attr('fill', "#fff");

        // pozíció szövege
        container.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', '#1a1a1a')
            .text('#');

        // csapatnév téglalapja
        container.append('rect')
            .attr('x', POSITION_WIDTH)
            .attr('y', 0)
            .attr('width', TEAM_NAME_WIDTH)
            .attr('height', HEADING_HEIGHT)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', "#fff");

        // csapatnév szövege
        container.append('text')
            .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', '#1a1a1a')
            .text('Csapatnév');

        const exerciseWidth = (SCREEN_WIDTH - TEAM_NAME_WIDTH - POSITION_WIDTH) / exercises.length;

        let offsetX = TEAM_NAME_WIDTH + POSITION_WIDTH;
        exercises.forEach(exercise => {
            drawExerciseHeading(exercise, offsetX, exerciseWidth, container);
            offsetX += exerciseWidth;
        });
    }

    function drawScoreboard() {
        const exerciseWidth = (SCREEN_WIDTH - TEAM_NAME_WIDTH - POSITION_WIDTH) / exercises.length;
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
        const elements = [];
        const teamDomEntry = {};

        // pozíció téglalapja
        const positionRect = container.append('rect')
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
        const positionText = container.append('text')
            .attr('x', POSITION_WIDTH / 2)
            .attr('y', offsetY + teamHeight / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', '#1a1a1a')
            .text(team.position + 1);
        elements.push(positionText);
        teamDomEntry.positionText = positionText;

        // téglalap
        elements.push(
            container.append('rect')
                .attr('x', POSITION_WIDTH)
                .attr('y', offsetY)
                .attr('width', TEAM_NAME_WIDTH)
                .attr('height', teamHeight)
                .attr('stroke', '#000')
                .style('stroke-width', 2)
                .attr('fill', "#fff")
        );
        // csapatnév
        elements.push(
            container.append('text')
                .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
                .attr('y', offsetY + teamHeight / 2 - HEADING_HEIGHT / 4)
                .attr('alignment-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('font-size', HEADING_HEIGHT / 2)
                .attr('fill', '#1a1a1a')
                .text(team.name)
        );

        // csapatnév
        elements.push(
            container.append('text')
                .attr('x', POSITION_WIDTH + TEAM_NAME_WIDTH / 2)
                .attr('y', offsetY + teamHeight / 2 + HEADING_HEIGHT / 3)
                .attr('alignment-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('font-size', HEADING_HEIGHT / 3)
                .attr('fill', '#1a1a1a')
                .text(team.school)
        );


        let offsetX = TEAM_NAME_WIDTH + POSITION_WIDTH;
        teamDomEntry.exercises = [];
        for (let i = 0; i < exercises.length; i++) {
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
            let rect = container.append('rect')
                .attr('x', offsetX)
                .attr('y', offsetY)
                .attr('width', exerciseWidth)
                .attr('height', teamHeight)
                .attr('stroke', '#000')
                .style('stroke-width', 2)
                .attr('fill', color.background);

            /*
            rect.on("click", function () {
                rect.transition()
                    .duration(0)
                    .transition()
                    .duration(1000)
                    .style("fill", COLORS[statuses[Math.floor(Math.random() * statuses.length)]])
                //   .duration(50000)
                //  .ease("linear")
                //  .attr('x', 0); // TODO YESS!!
            });
             */
            elements.push(rect)
            exerciseDOM.elements.push(rect);
            exerciseDOM.rect = rect;


            const countText = container.append('text')
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


            const timeText = container.append('text')
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

    function drawExerciseHeading(exercise, offsetX, size, container) {
        let rect = container.append('rect')
            .attr('x', offsetX)
            .attr('y', 0)
            .attr('width', size)
            .attr('height', HEADING_HEIGHT)
            .attr('stroke', '#000')
            .style('stroke-width', 2)
            .attr('fill', exercise.background);

        let text = container.append('text')
            .attr('x', offsetX + size / 2)
            .attr('y', HEADING_HEIGHT / 2)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('font-size', HEADING_HEIGHT / 2)
            .attr('fill', exercise.color ? exercise.color : '#000')
            .text(exercise.id);
    }
});
