class CouponTracker {
  constructor() {
    this.coupons = JSON.parse(localStorage.getItem("coupons")) || [];
    this.currentEditId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderCoupons();
    this.updateStats();
    this.setMinDate();

    if ("Notification" in window) {
      if (
        Notification.permission === "default" ||
        Notification.permission === "denied"
      ) {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission:", permission);
        });
      }
    }

    this.checkExpiringCoupons();
  }

  setupEventListeners() {
    document.getElementById("addCouponBtn").addEventListener("click", () => {
      this.openModal();
    });

    document.getElementById("couponModal").addEventListener("click", (e) => {
      if (
        e.target.id === "couponModal" ||
        e.target.classList.contains("close") ||
        e.target.id === "cancelBtn"
      ) {
        this.closeModal();
      }
    });

    document.getElementById("couponForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveCoupon();
    });

    document.getElementById("searchInput").addEventListener("input", () => {
      this.filterCoupons();
    });

    document.getElementById("filterCategory").addEventListener("change", () => {
      this.filterCoupons();
    });

    document.getElementById("filterStatus").addEventListener("change", () => {
      this.filterCoupons();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  setMinDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("expiryDate").min = today;
  }

  openModal(coupon = null) {
    const modal = document.getElementById("couponModal");
    const modalTitle = document.getElementById("modalTitle");
    const form = document.getElementById("couponForm");

    if (coupon) {
      this.currentEditId = coupon.id;
      modalTitle.textContent = "Edit Coupon";
      this.populateForm(coupon);
    } else {
      this.currentEditId = null;
      modalTitle.textContent = "Add New Coupon";
      form.reset();
    }

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    const modal = document.getElementById("couponModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    this.currentEditId = null;
  }

  populateForm(coupon) {
    document.getElementById("couponTitle").value = coupon.title;
    document.getElementById("couponCode").value = coupon.code || "";
    document.getElementById("discountAmount").value = coupon.discountAmount;
    document.getElementById("storeName").value = coupon.storeName;
    document.getElementById("category").value = coupon.category;
    document.getElementById("expiryDate").value = coupon.expiryDate || "";
    document.getElementById("description").value = coupon.description || "";
    document.getElementById("terms").value = coupon.terms || "";
  }

  saveCoupon() {
    const formData = {
      title: document.getElementById("couponTitle").value.trim(),
      code: document.getElementById("couponCode").value.trim(),
      discountAmount: document
        .getElementById("discountAmount")
        .value.trim(),
      storeName: document.getElementById("storeName").value.trim(),
      category: document.getElementById("category").value,
      expiryDate: document.getElementById("expiryDate").value,
      description: document.getElementById("description").value.trim(),
      terms: document.getElementById("terms").value.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    if (!formData.title || !formData.discountAmount || !formData.storeName) {
      this.showNotification("Please fill in all required fields", "error");
      return;
    }

    if (this.currentEditId) {
      const index = this.coupons.findIndex((c) => c.id === this.currentEditId);
      if (index !== -1) {
        this.coupons[index] = { ...this.coupons[index], ...formData };
        this.showNotification("Coupon updated successfully!", "success");
      }
    } else {
      formData.id = Date.now().toString();
      this.coupons.unshift(formData);
      this.showNotification("Coupon added successfully!", "success");
    }

    this.saveToLocalStorage();
    this.renderCoupons();
    this.updateStats();
    this.closeModal();
  }

  deleteCoupon(id) {
    if (confirm("Are you sure you want to delete this coupon?")) {
      this.coupons = this.coupons.filter((c) => c.id !== id);
      this.saveToLocalStorage();
      this.renderCoupons();
      this.updateStats();
      this.showNotification("Coupon deleted successfully!", "success");
    }
  }

  toggleStatus(id) {
    const coupon = this.coupons.find((c) => c.id === id);
    if (coupon) {
      if (coupon.status === "active") {
        coupon.status = "used";
      } else if (coupon.status === "used") {
        coupon.status = "active";
      }
      this.saveToLocalStorage();
      this.renderCoupons();
      this.updateStats();
      this.showNotification("Coupon status updated!", "success");
    }
  }

  notifyCoupon(coupon) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Coupon Reminder", {
        body: `${coupon.title} expires on ${coupon.expiryDate}`,
        icon: "https://cdn-icons-png.flaticon.com/512/709/709496.png",
      });
    }
  }

  checkExpiringCoupons() {
    const today = new Date();
    this.coupons.forEach((coupon) => {
      if (coupon.expiryDate) {
        const expiry = new Date(coupon.expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          this.notifyCoupon(coupon);
        }
      }
    });
  }

  getStatus(coupon) {
    if (coupon.status === "used") return "used";
    if (coupon.expiryDate) {
      const today = new Date();
      const expiryDate = new Date(coupon.expiryDate);
      if (expiryDate < today) return "expired";
    }
    return "active";
  }

  getStatusText(status) {
    switch (status) {
      case "active":
        return "Active";
      case "expired":
        return "Expired";
      case "used":
        return "Used";
      default:
        return "Active";
    }
  }

  getDaysUntilExpiry(expiryDate) {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  renderCoupons() {
    const couponsList = document.getElementById("couponsList");
    const noCoupons = document.getElementById("noCoupons");

    if (this.coupons.length === 0) {
      couponsList.innerHTML = "";
      noCoupons.style.display = "block";
      return;
    }

    noCoupons.style.display = "none";

    const filteredCoupons = this.getFilteredCoupons().sort((a, b) => {
      const statusOrder = { active: 1, used: 2, expired: 3 };
      return statusOrder[this.getStatus(a)] - statusOrder[this.getStatus(b)];
    });

    if (filteredCoupons.length === 0) {
      couponsList.innerHTML =
        '<div class="no-coupons" style="display: block;"><i class="fas fa-search"></i><h3>No coupons found</h3><p>Try adjusting your search or filters</p></div>';
      return;
    }

    couponsList.innerHTML = filteredCoupons
      .map((coupon) => {
        const status = this.getStatus(coupon);
        const daysUntilExpiry = this.getDaysUntilExpiry(coupon.expiryDate);

        return `
          <div class="coupon-card ${status}" data-id="${coupon.id}">
            <div class="coupon-header">
              <div>
                <div class="coupon-title">${this.escapeHtml(coupon.title)}</div>
                <div class="coupon-store">${this.escapeHtml(coupon.storeName)}</div>
              </div>
              <span class="status-badge status-${status}">
                ${this.getStatusText(status)}
              </span>
              ${
                daysUntilExpiry !== null &&
                daysUntilExpiry > 0 &&
                daysUntilExpiry <= 2
                  ? `<span class="status-badge status-warning">⚠ Expiring Soon</span>`
                  : ""
              }
            </div>
            <div class="coupon-details">
              <div class="discount-amount">${this.escapeHtml(
                coupon.discountAmount
              )}</div>
              ${
                coupon.code
                  ? `<div class="coupon-code" onclick="couponTracker.copyToClipboard('${coupon.code}')" style="cursor: pointer;" title="Click to copy">${this.escapeHtml(
                      coupon.code
                    )}</div>`
                  : ""
              }
              ${
                coupon.expiryDate
                  ? `<div class="expiry-date">
                    <i class="fas fa-calendar"></i> Expires: ${new Date(
                      coupon.expiryDate
                    ).toLocaleDateString()}
                    ${
                      daysUntilExpiry !== null
                        ? ` (${
                            daysUntilExpiry > 0
                              ? daysUntilExpiry + " days left"
                              : "Expired"
                          })`
                        : ""
                    }
                  </div>`
                  : ""
              }
              ${
                coupon.description
                  ? `<div class="description">${this.escapeHtml(
                      coupon.description
                    )}</div>`
                  : ""
              }
              ${
                coupon.terms
                  ? `<div class="description"><strong>Terms:</strong> ${this.escapeHtml(
                      coupon.terms
                    )}</div>`
                  : ""
              }
            </div>
            <div class="coupon-actions">
              <button class="btn btn-primary btn-small" onclick="couponTracker.openModal(${JSON.stringify(
                coupon
              ).replace(/"/g, "&quot;")})">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-secondary btn-small" onclick="couponTracker.toggleStatus('${
                coupon.id
              }')">
                <i class="fas fa-${
                  status === "used" ? "undo" : "check"
                }"></i> ${status === "used" ? "Mark Active" : "Mark Used"}
              </button>
              <button class="btn btn-danger btn-small" onclick="couponTracker.deleteCoupon('${
                coupon.id
              }')">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>`;
      })
      .join("");
  }

  getFilteredCoupons() {
    const searchTerm =
      document.getElementById("searchInput").value.toLowerCase();
    const categoryFilter = document.getElementById("filterCategory").value;
    const statusFilter = document.getElementById("filterStatus").value;

    return this.coupons.filter((coupon) => {
      const matchesSearch =
        !searchTerm ||
        coupon.title.toLowerCase().includes(searchTerm) ||
        coupon.storeName.toLowerCase().includes(searchTerm) ||
        coupon.code.toLowerCase().includes(searchTerm) ||
        coupon.discountAmount.toLowerCase().includes(searchTerm);

      const matchesCategory =
        !categoryFilter || coupon.category === categoryFilter;

      const status = this.getStatus(coupon);
      const matchesStatus = !statusFilter || status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  filterCoupons() {
    this.renderCoupons();
  }

  updateStats() {
    const total = this.coupons.length;
    const active = this.coupons.filter(
      (c) => this.getStatus(c) === "active"
    ).length;
    const used = this.coupons.filter(
      (c) => this.getStatus(c) === "used"
    ).length;
    const expired = this.coupons.filter(
      (c) => this.getStatus(c) === "expired"
    ).length;

    document.getElementById("totalCoupons").textContent = total;
    document.getElementById("activeCoupons").textContent = active;
    document.getElementById("usedCoupons").textContent = used;
    document.getElementById("expiredCoupons").textContent = expired;
  }

  saveToLocalStorage() {
    localStorage.setItem("coupons", JSON.stringify(this.coupons));
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "exclamation-circle"
          : "info-circle"
      }"></i>
      <span>${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#4CAF50"
          : type === "error"
          ? "#f44336"
          : "#2196F3"
      };
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);
    setTimeout(() => {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  exportCoupons() {
    const dataStr = JSON.stringify(this.coupons, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coupons-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importCoupons(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCoupons = JSON.parse(e.target.result);
        if (Array.isArray(importedCoupons)) {
          this.coupons = [...this.coupons, ...importedCoupons];
          this.saveToLocalStorage();
          this.renderCoupons();
          this.updateStats();
          this.showNotification("Coupons imported successfully!", "success");
        } else {
          this.showNotification("Invalid file format", "error");
        }
      } catch (error) {
        this.showNotification("Error importing coupons", "error");
      }
    };
    reader.readAsText(file);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.couponTracker = new CouponTracker();

  if (couponTracker.coupons.length === 0) {
    const sampleCoupons = [
      {
        id: "1",
        title: "Summer Sale Discount",
        code: "SUMMER20",
        discountAmount: "20% off",
        storeName: "Amazon",
        category: "electronics",
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        description: "Get 20% off on all electronics during summer sale",
        terms: "Minimum purchase $50, valid on selected items only",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];
    couponTracker.coupons = sampleCoupons;
    couponTracker.saveToLocalStorage();
    couponTracker.renderCoupons();
    couponTracker.updateStats();
  }
});
