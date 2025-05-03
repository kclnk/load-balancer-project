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

// Function to dynamically populate the table (example)
function updateTable(serverStats) {
    const tbody = document.querySelector("#serversTable tbody");
    tbody.innerHTML = ""; // Clear previous data

    serverStats.forEach(server => {
        const row = document.createElement('tr');

        // Add classes to easily target specific columns
        const urlCell = document.createElement('td');
        urlCell.textContent = server.url;
        urlCell.className = 'url';

        const statusCell = document.createElement('td');
        statusCell.textContent = server.status ? "UP" : "DOWN";
        statusCell.className = 'status';

        const requestsCell = document.createElement('td');
        requestsCell.textContent = server.requests;
        requestsCell.className = 'requests';

        row.appendChild(urlCell);
        row.appendChild(statusCell);
        row.appendChild(requestsCell);
        tbody.appendChild(row);

        

        // Add hover event listeners after the row has been added
        row.addEventListener('mouseenter', function () {
            // Get data for the hovered row
            const url = this.querySelector('.url').textContent;
            const status = this.querySelector('.status').textContent;
            const requests = this.querySelector('.requests').textContent;

            // Set the card's content
            document.getElementById('cardURL').textContent = `URL: ${url}`;
            document.getElementById('cardStatus').textContent = `Status: ${status}`;
            document.getElementById('cardRequests').textContent = `Requests: ${requests}`;

            // Show the card
            document.getElementById('hoverCard').style.display = 'block';
        });

        row.addEventListener('mouseleave', function () {
            // Hide the card when mouse leaves the row
            document.getElementById('hoverCard').style.display = 'none';
        });
    });

    // Make the card follow the mouse
    document.addEventListener('mousemove', function (e) {
        const card = document.getElementById('hoverCard');
        if (card.style.display === 'block') {
            // Position the card near the mouse
            card.style.top = `${e.clientY + 10}px`;  // Offset from mouse position
            card.style.left = `${e.clientX + 10}px`;  // Offset from mouse position
        }
    });
}

// Update the pie chart with request distribution data
function updatePieChart(serverStats) {
    const labels = serverStats.map(server => server.url);
    const data = serverStats.map(server => server.requests);

    if (!pieChart) {
        // Initial chart creation with animation
        const ctx = document.getElementById('requestPieChart').getContext('2d');
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
                responsive: true,
                animation: {
                    animateRotate: true,
                    animateScale: true
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } else {
        // Update data without animation
        pieChart.data.labels = labels;
        pieChart.data.datasets[0].data = data;
        pieChart.update(); // Update chart without animation
    }
}

// Initialize the health and requests graph for each server
function updateRequestsHealthGraph(serverStats) {
    const container = document.querySelector('#chartsContainer');
    if (!container) {
        console.error('Charts container not found!');
        return;
    }

    serverStats.forEach((server, index) => {
        // Check if we already have a chart for the server
        let chart = chartInstances[index];

        if (!chart) {
            // Create a div for each server's chart
            const serverDiv = document.createElement('div');
            serverDiv.className = 'server-chart-container'; // Class for styling

            // Create a canvas for each server
            const canvas = document.createElement('canvas');
            canvas.id = `serverChart-${server.url}`; // Unique ID based on server URL
            serverDiv.appendChild(canvas);

            // Append the server div to the container
            container.appendChild(serverDiv);

            // Create a new chart for the server
            const ctx = canvas.getContext('2d');
            
            // Create gradient for fill
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(255, 99, 133, 0.38)');  // Red with opacity
            gradient.addColorStop(1, 'rgba(255, 99, 132, 0.1)');  // Faded red
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [], // timestamps
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
                                // Only fill the area under the curve when value is 1 (server is UP)
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
                            title: { display: true, text: 'Time' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Requests' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Health (1 = UP, 0 = DOWN)' },
                            grid: { drawOnChartArea: false },
                            min: 0,
                            max: 1
                        }
                    }
                }
            });

            // Store the chart instance in the array
            chartInstances[index] = chart;
        }

        // Update chart data for each server
        const timestamp = new Date().toLocaleTimeString();
        let totalRequests = server.requests;
        let overallHealth = server.status ? 1 : 0;

        // Shift data arrays if too many points
        if (chart.data.labels.length > 30) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        // Add new data
        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(totalRequests);
        chart.data.datasets[1].data.push(overallHealth);

        // Update the chart
        chart.update();
    });
}

// Fetch stats immediately when page loads
fetchStats();

// Fetch stats every 2 seconds
setInterval(fetchStats, 2000);

// Delay script execution until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchStats(); // Initial data fetch
});


// Add hover event listeners to table rows
document.querySelectorAll('#serversTable tbody tr').forEach(row => {
    row.addEventListener('mouseenter', function () {
        // Get data for the hovered row
        const url = this.querySelector('.url').textContent;
        const status = this.querySelector('.status').textContent;
        const requests = this.querySelector('.requests').textContent;

        // Set the card's content
        document.getElementById('cardURL').textContent = `URL: ${url}`;
        document.getElementById('cardStatus').textContent = `Status: ${status}`;
        document.getElementById('cardRequests').textContent = `Requests: ${requests}`;

        // Get the row's position on the screen
        const rowRect = this.getBoundingClientRect();
        const card = document.getElementById('hoverCard');

        // Position the card based on the row's position
        card.style.top = `${rowRect.top + window.scrollY + 20}px`;
        card.style.left = `${rowRect.left + window.scrollX + 20}px`;

        // Display the card
        card.style.display = 'block';
    });

    row.addEventListener('mouseleave', function () {
        // Hide the card when mouse leaves the row
        document.getElementById('hoverCard').style.display = 'none';
    });
});


