let pieChart;
let chartInstances = []; // Store instances of charts for each server

// Called once every 2 seconds
async function fetchStats() {
    const response = await fetch('http://localhost:5000/stats');
    const data = await response.json();

    updateTable(data.servers);
    updatePieChart(data.servers);
    updateRequestsHealthGraph(data.servers);
}

function updateTable(serverStats) {
    const tbody = document.querySelector("#serversTable tbody");
    tbody.innerHTML = ""; // Clear previous data

    serverStats.forEach(server => {
        const mainTable_row = document.createElement('tr');

        const urlCell = document.createElement('td');
        urlCell.className = 'url';

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "12");
        svg.setAttribute("height", "12");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.style.marginRight = "15px";

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "8");
        circle.setAttribute("cy", "8");
        circle.setAttribute("r", "6");
        circle.setAttribute("fill", server.status ? "green" : "red");

        svg.appendChild(circle);
        urlCell.appendChild(svg);

        const urlTextSpan = document.createElement('span');
        urlTextSpan.textContent = server.url;
        urlCell.appendChild(urlTextSpan);

        const statusCell = document.createElement('td');
        statusCell.textContent = server.status ? "UP" : "DOWN";
        statusCell.className = 'status';
        statusCell.classList.add(server.status ? 'status-up' : 'status-down');

        const requestsCell = document.createElement('td');
        requestsCell.textContent = server.requests;
        requestsCell.className = 'requests';

        mainTable_row.appendChild(urlCell);
        mainTable_row.appendChild(statusCell);
        mainTable_row.appendChild(requestsCell);

        tbody.appendChild(mainTable_row);

        mainTable_row.addEventListener('mouseenter', function () {
            const url = this.querySelector('.url span')?.textContent;
            const status = this.querySelector('.status')?.textContent;
            const requests = this.querySelector('.requests')?.textContent;

            const serverData = serverStats.find(s => s.url === url);

            if (url && status && requests && serverData) {
                document.getElementById('cardURL').textContent = `URL: ${url}`;
                document.getElementById('cardStatus').textContent = `Status: ${status}`;
                document.getElementById('cardRequests').textContent = `Requests: ${requests}`;
                document.getElementById('cardCPU').textContent = `CPU Usage: ${serverData.cpu}%`;
                document.getElementById('cardRAM').textContent = `RAM Usage: ${serverData.ram} MB`;
                document.getElementById('cardLatency').textContent = `Latency: ${serverData.latency} ms`;
                document.getElementById('cardUptime').textContent = `Uptime: ${serverData.up_time}`;

                document.getElementById('hoverCard').style.display = 'block';
            }
        });

        mainTable_row.addEventListener('mouseleave', function () {
            document.getElementById('hoverCard').style.display = 'none';
        });
    });

    document.addEventListener('mousemove', function (e) {
        const card = document.getElementById('hoverCard');
        if (card.style.display === 'block') {
            card.style.top = `${e.clientY + 10}px`;
            card.style.left = `${e.clientX + 10}px`;
        }
    });
}

function updatePieChart(serverStats) {
    const labels = serverStats.map(server => server.url);
    const data = serverStats.map(server => server.requests);

    const canvas = document.getElementById('requestPieChart');
    const ctx = canvas.getContext('2d');
    const dpi = window.devicePixelRatio || 1;

    canvas.style.width = '400px';
    canvas.style.height = '400px';
    canvas.width = 400 * dpi;
    canvas.height = 400 * dpi;
    ctx.scale(dpi, dpi);

    if (!pieChart) {
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Request Distribution',
                    data: data,
                    backgroundColor: ['#4CAF50', '#2196F3', '#FFC107'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                animation: {
                    animateRotate: true,
                    animateScale: true
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff' // white text for legend
                        }
                    },
                    tooltip: {
                        bodyColor: '#ffffff',
                        titleColor: '#ffffff'
                    }
                }
            }
        });
    } else {
        pieChart.data.labels = labels;
        pieChart.data.datasets[0].data = data;
        pieChart.update();
    }
}

function updateRequestsHealthGraph(serverStats) {
    const container = document.querySelector('#chartsContainer');
    if (!container) {
        console.error('Charts container not found!');
        return;
    }

    serverStats.forEach((server, index) => {
        let chart = chartInstances[index];

        if (!chart) {
            const serverDiv = document.createElement('div');
            serverDiv.className = 'server-chart-container';

            const canvas = document.createElement('canvas');
            canvas.id = `serverChart-${server.url}`;
            serverDiv.appendChild(canvas);
            container.appendChild(serverDiv);

            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(255, 99, 133, 0.38)');
            gradient.addColorStop(1, 'rgba(255, 99, 132, 0.1)');

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: `${server.url} - Requests`,
                            data: [],
                            borderColor: '#4CAF50',
                            backgroundColor: 'transparent',
                            yAxisID: 'y',
                            tension: 0.3
                        },
                        {
                            label: `${server.url} - Health`,
                            data: [],
                            borderColor: '#F44336',
                            backgroundColor: gradient,
                            fill: true,
                            yAxisID: 'y1',
                            stepped: true,
                            segment: {
                                backgroundColor: context => {
                                    const value = context.p1.parsed.y;
                                    return value === 1 ? gradient : 'transparent';
                                }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    stacked: false,
                    scales: {
                        x: {
                            title: { display: true, text: 'Time', color: '#ffffff' },
                            ticks: { color: '#ffffff' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Requests', color: '#ffffff' },
                            ticks: { color: '#ffffff' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: '1 = UP, 0 = DOWN', color: '#ffffff' },
                            grid: { drawOnChartArea: false },
                            min: 0,
                            max: 1,
                            ticks: { color: '#ffffff' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        },
                        tooltip: {
                            bodyColor: '#ffffff',
                            titleColor: '#ffffff'
                        }
                    }
                }
            });

            chartInstances[index] = chart;
        }

        const timestamp = new Date().toLocaleTimeString();
        const totalRequests = server.requests;
        const overallHealth = server.status ? 1 : 0;

        if (chart.data.labels.length > 30) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(totalRequests);
        chart.data.datasets[1].data.push(overallHealth);

        chart.update();
    });
}

// Fetch stats immediately when page loads
fetchStats();

// Fetch stats every 2 seconds
setInterval(fetchStats, 2000);

// Delay script execution until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchStats();
});
