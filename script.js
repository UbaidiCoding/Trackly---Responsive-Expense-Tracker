// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const totalExpensesEl = document.getElementById('totalExpenses');
const expenseCountEl = document.getElementById('expenseCount');
const avgExpenseEl = document.getElementById('avgExpense');
const largestExpenseEl = document.getElementById('largestExpense');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');

// Initialize expenses array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Initialize theme
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

// Initialize Chart.js
const ctx = document.getElementById('expenseChart').getContext('2d');
let expenseChart;

// Function to update the chart
function updateChart() {
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (expenses.length === 0) {
        return;
    }
    
    // Aggregate expenses by category
    const categories = [...new Set(expenses.map(expense => expense.category))];
    const categoryTotals = {};
    
    categories.forEach(category => {
        categoryTotals[category] = expenses
            .filter(expense => expense.category === category)
            .reduce((total, expense) => total + parseFloat(expense.amount), 0);
    });
    
    // Prepare chart data
    const chartData = {
        labels: categories.map(cat => getCategoryName(cat)),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: [
                '#4361ee', '#7209b7', '#4cc9f0', '#f72585', '#ffd166',
                '#06d6a0', '#118ab2', '#ef476f', '#ff9e00', '#8ac926'
            ],
            borderWidth: 0
        }]
    };
    
    // Create new chart
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text'),
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.toFixed(2)}`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Function to add an expense
function addExpense(e) {
    e.preventDefault();
    
    const title = document.getElementById('expenseTitle').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value).toFixed(2);
    const category = document.getElementById('expenseCategory').value;
    
    if (!title || !amount || !category) {
        alert('Please fill in all fields');
        return;
    }
    
    const expense = {
        id: Date.now(),
        title,
        amount,
        category,
        date: new Date().toISOString().split('T')[0]
    };
    
    expenses.push(expense);
    updateLocalStorage();
    renderExpenses();
    updateSummary();
    updateChart();
    
    // Reset form
    expenseForm.reset();
}

// Function to delete an expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        updateLocalStorage();
        renderExpenses();
        updateSummary();
        updateChart();
    }
}

// Function to render expenses
function renderExpenses() {
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No expenses recorded</h3>
                <p>Add your first expense to get started</p>
            </div>
        `;
        return;
    }
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    expenseList.innerHTML = sortedExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-title">${expense.title}</div>
                <div class="expense-category">${getCategoryName(expense.category)}</div>
            </div>
            <div class="expense-amount">${formatCurrency(parseFloat(expense.amount))}</div>
            <div class="expense-actions">
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Function to get category name
function getCategoryName(category) {
    const categories = {
        'food': 'Food & Dining',
        'transport': 'Transportation',
        'shopping': 'Shopping',
        'housing': 'Housing',
        'entertainment': 'Entertainment',
        'utilities': 'Utilities',
        'health': 'Health & Fitness',
        'travel': 'Travel',
        'other': 'Other'
    };
    return categories[category] || category;
}

// Function to update summary
function updateSummary() {
    const total = expenses.reduce((total, expense) => 
        total + parseFloat(expense.amount), 0);
    
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;
    
    const largest = expenses.length > 0 ? 
        Math.max(...expenses.map(expense => parseFloat(expense.amount))) : 0;
    
    totalExpensesEl.textContent = formatCurrency(total);
    expenseCountEl.textContent = count;
    avgExpenseEl.textContent = formatCurrency(average);
    largestExpenseEl.textContent = formatCurrency(largest);
}

// Function to update localStorage
function updateLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Function to toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

// Function to export to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export');
        return;
    }
    
    let csv = 'Title,Amount,Category,Date\n';
    
    expenses.forEach(expense => {
        csv += `"${expense.title}",${expense.amount},${getCategoryName(expense.category)},"${expense.date}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `trackly-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
expenseForm.addEventListener('submit', addExpense);
themeToggle.addEventListener('click', toggleTheme);
exportBtn.addEventListener('click', exportToCSV);

// Initialize app
function init() {
    renderExpenses();
    updateSummary();
    updateChart();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
