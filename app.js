// =============================================
// Project: SmartPark - Parking Lot Reservation System
// Authors: Satuito, Maria Vera Mae O.    2412860
//          Morillo, Nelessa P.           2412853
//          Vargas, Jesalyn C.            2411148
//          Cuevas, Catherine Princess S. 2412649
// Date: December 16, 2025
// Description: Web-based parking management system implementing
//              ArrayList for reservations and Queue (FIFO) for 
//              waiting list management with real-time visualization.
// Data Structures Used:
//   1. ArrayList - Stores active parking reservations
//   2. Queue (FIFO) - Manages waiting list when parking is full
// =============================================

(function(){
  // ============================================
  // DOM Element References
  // ============================================
  const parkingGrid = document.getElementById('parking-grid');
  const slotSelect = document.getElementById('slot-select');
  const insertBtn = document.getElementById('insert-btn');
  const plateInput = document.getElementById('plate-input');
  const arrayListItems = document.getElementById('arraylist-items');
  const arrayListEmpty = document.getElementById('arraylist-empty');
  const queueItems = document.getElementById('queue-items');
  const queueEmpty = document.getElementById('queue-empty');
  const countAvailable = document.getElementById('count-available');
  const countReserved = document.getElementById('count-reserved');
  const countQueue = document.getElementById('count-queue');
  const arraySizeLabel = document.getElementById('array-size');
  const queueSizeLabel = document.getElementById('queue-size');
  const slotsAvailable = document.getElementById('slots-available');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchResult = document.getElementById('search-result');
  const sortSlotBtn = document.getElementById('sort-slot');
  const sortTimeBtn = document.getElementById('sort-time');
  const traverseBtn = document.getElementById('traverse');

  // ============================================
  // Data Structure Initialization
  // ============================================
  const TOTAL_SLOTS = 20; // Total parking capacity
  
  /**
   * DATA STRUCTURE 1: ArrayList (Array-based implementation)
   * Purpose: Stores all active parking reservations
   * Operations: Insert O(1), Delete O(n), Search O(n), Sort O(n log n)
   * Structure: [{plate, slot, time, id}, ...]
   */
  const parkingSlots = new Array(TOTAL_SLOTS).fill(null); // Physical slot tracker
  const arrayList = []; // ArrayList for reservation data
  
  /**
   * DATA STRUCTURE 2: Queue (FIFO - First In First Out)
   * Purpose: Manages waiting list when parking lot is full
   * Operations: Enqueue O(1), Dequeue O(1), Peek O(1)
   * Structure: [{plate, time, id}, ...]
   */
  const queue = []; // Queue for waiting vehicles

  // ============================================
  // Persistence Functions (LocalStorage)
  // ============================================
  
  /**
   * Saves current state to browser's localStorage
   * Preserves data across page refreshes
   */
  function saveState() {
    try {
      localStorage.setItem('smartpark_slots', JSON.stringify(parkingSlots));
      localStorage.setItem('smartpark_arraylist', JSON.stringify(arrayList));
      localStorage.setItem('smartpark_queue', JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  /**
   * Loads saved state from localStorage on page load
   * Restores previous session data
   */
  function loadState() {
    try {
      const savedSlots = localStorage.getItem('smartpark_slots');
      const savedArray = localStorage.getItem('smartpark_arraylist');
      const savedQueue = localStorage.getItem('smartpark_queue');
      
      if (savedSlots) {
        const parsed = JSON.parse(savedSlots);
        parsed.forEach((slot, i) => parkingSlots[i] = slot);
      }
      if (savedArray) {
        arrayList.push(...JSON.parse(savedArray));
      }
      if (savedQueue) {
        queue.push(...JSON.parse(savedQueue));
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  /**
   * Utility function to get current timestamp
   * @returns {string} Formatted date and time string
   */
  const nowString = () => new Date().toLocaleString();

  // ============================================
  // UI Rendering Functions
  // ============================================

  /**
   * Renders the parking grid visualization
   * Displays all 20 parking slots with their status (available/occupied)
   * Updates slot selection dropdown
   */
  function renderGrid(){
    parkingGrid.innerHTML = '';
    slotSelect.innerHTML = '<option value="auto">AUTO-ASSIGN (First Available)</option>';
    
    for(let i=0; i<TOTAL_SLOTS; i++){
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot ' + (parkingSlots[i] ? 'occupied' : 'available');
      slotDiv.dataset.index = i;

      // Visual content based on slot status
      let carContent = '';
      if(parkingSlots[i]){
        carContent = `<div class="car">🚗</div><div class="plate">${parkingSlots[i].plate}</div>`;
      } else {
        carContent = `<div class="car"><span class="arrow-bounce">⬇️</span></div>`;
      }

      slotDiv.innerHTML = `
        <div class="label">${i+1}</div>
        <div class="content">
          ${carContent}
        </div>
      `;

      // Click handler for slot interaction
      slotDiv.addEventListener('click', ()=> {
        if(parkingSlots[i]){
          showSlotDetails(i);
        } else {
          slotSelect.value = (i+1).toString();
        }
      });

      parkingGrid.appendChild(slotDiv);

      // Add to dropdown selection
      const opt = document.createElement('option');
      opt.value = (i+1).toString();
      opt.textContent = `Slot ${i+1}`;
      slotSelect.appendChild(opt);
    }
    updateCounters();
  }

  /**
   * Shows details of an occupied parking slot
   * Allows user to delete the reservation
   * @param {number} i - Slot index (0-based)
   */
  function showSlotDetails(i){
    const res = parkingSlots[i];
    if(!res) return;
    const conf = confirm(`Slot ${i+1}\nPlate: ${res.plate}\nTime: ${res.time}\n\nPress OK to DELETE this reservation.`);
    if(conf){
      deleteReservation(res.id);
    }
  }

  /**
   * Updates all counter displays in the UI
   * Shows available slots, reserved slots, and queue length
   */
  function updateCounters(){
    const reserved = arrayList.length;
    const queued = queue.length;
    const available = TOTAL_SLOTS - reserved;
    
    countAvailable.textContent = available;
    countReserved.textContent = reserved;
    countQueue.textContent = queued;
    arraySizeLabel.textContent = `(${reserved} items)`;
    queueSizeLabel.textContent = `(${queued} waiting)`;
    slotsAvailable.textContent = available;
  
    // Update data structure implementation panel counters
    const dsCountElements = document.querySelectorAll('.highlight-count');
    const dsCountQueueElements = document.querySelectorAll('.highlight-count-queue');
    if (dsCountElements.length > 0) {
      dsCountElements[0].textContent = reserved;
    }
    if (dsCountQueueElements.length > 0) {
      dsCountQueueElements[0].textContent = queued;
    }

    updateInsertPanel();
  }

  /**
   * Updates the insert button appearance based on parking availability
   * Changes to "JOIN QUEUE" mode when parking is full
   */
  function updateInsertPanel(){
    const available = TOTAL_SLOTS - arrayList.length;
    const insertBtn = document.getElementById('insert-btn');
    const btnText = document.getElementById('btn-text');
    const slotsStatus = document.getElementById('slots-status');
    const slotsAvailableSpan = document.getElementById('slots-available');
    const slotsAvailableDiv = slotsStatus.querySelector('div');
    
    if(available === 0){
      // Parking is full - switch to queue mode
      insertBtn.classList.add('queue-mode');
      btnText.textContent = 'JOIN QUEUE';
      
      slotsStatus.classList.add('full');
      slotsAvailableSpan.textContent = '0';
      slotsAvailableDiv.innerHTML = '🚫 PARKING FULL - WILL BE QUEUED';
    } else {
      // Parking has available slots
      insertBtn.classList.remove('queue-mode');
      btnText.textContent = 'INSERT TO ARRAYLIST';

      slotsStatus.classList.remove('full');
      slotsAvailableSpan.textContent = available;
      slotsAvailableDiv.textContent = 'SLOTS AVAILABLE';
    }
  }

  // ============================================
  // ArrayList Operations
  // ============================================

  /**
   * DELETE Operation - Removes a reservation from ArrayList
   * Time Complexity: O(n) - requires finding and shifting elements
   * Implements FIFO queue automatic assignment when slot becomes available
   * @param {string} id - Unique reservation ID
   */
  function deleteReservation(id){
    const idx = arrayList.findIndex(r=>r.id===id);
    if(idx===-1) return;
    
    const slotNum = arrayList[idx].slot;
    arrayList.splice(idx,1); // O(n) operation - removes and shifts elements
    parkingSlots[slotNum-1] = null;

    // FIFO Queue Implementation - Auto-assign from queue
    if(queue.length>0){
      const next = queue.shift(); // DEQUEUE O(1) - remove from front
      const time = nowString();
      const nid = 'id'+Date.now()+Math.floor(Math.random()*999);
      parkingSlots[slotNum-1] = {plate: next.plate, time, id: nid};
      arrayList.push({plate: next.plate, slot: slotNum, time, id: nid});
      alert(`🎯 FIFO Queue: ${next.plate} automatically assigned to slot ${slotNum}`);
    }

    saveState(); 
    renderGrid();
    renderArrayList();
    renderQueue();
  }

  /**
   * Renders the ArrayList visualization panel
   * Displays all active reservations with slot, plate, time, and actions
   */
  function renderArrayList(){
    if(arrayList.length===0){
      arrayListEmpty.style.display = 'block';
      arrayListItems.style.display = 'none';
    } else {
      arrayListEmpty.style.display = 'none';
      arrayListItems.style.display = 'block';
      arrayListItems.innerHTML = '';
      
      for(let i=0; i<arrayList.length; i++){
        const r = arrayList[i];
        const stickerCode = `SP-${r.plate}-${String(r.slot).padStart(2,'0')}-${r.id.substring(2,10).toUpperCase()}`;
        
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
          <div>
            <div class="slot-badge">#${r.slot}</div>
            <div class="content-right">
              <div class="plate-number">${r.plate}</div>
              <div class="meta">🕐 ${r.time}</div>
              <div class="sticker-code">${stickerCode}</div>
            </div>
          </div>
          <div class="actions">
            <button class="btn-sticker" data-id="${r.id}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22,10 L22,6 C22,4.9 21.1,4 20,4 L4,4 C2.9,4 2,4.9 2,6 L2,10 C3.1,10 4,10.9 4,12 C4,13.1 3.1,14 2,14 L2,18 C2,19.1 2.9,20 4,20 L20,20 C21.1,20 22,19.1 22,18 L22,14 C20.9,14 20,13.1 20,12 C20,10.9 20.9,10 22,10 Z M13,17.5 L13,6.5 L15.25,6.5 C16.35,6.5 17.25,7.4 17.25,8.5 C17.25,9.6 16.35,10.5 15.25,10.5 L13,10.5 L13,17.5 Z"/>
              </svg>
              STICKER
            </button>
            <button class="btn-delete" data-id="${r.id}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              DELETE
            </button>
          </div>
        `;
     
        // Sticker button handler
        const stickerBtn = item.querySelector('.btn-sticker');
        stickerBtn.addEventListener('click', ()=> {
          localStorage.setItem('currentSticker', JSON.stringify({
            plate: r.plate,
            slot: r.slot,
            time: r.time,
            code: stickerCode
          }));
          window.open('sticker.html', '_blank');
        });
      
        // Delete button handler
        const delBtn = item.querySelector('.btn-delete');
        delBtn.addEventListener('click', ()=> {
          if(confirm(`Delete reservation for ${r.plate} (slot ${r.slot})?`)){
            deleteReservation(r.id);
          }
        });
        
        arrayListItems.appendChild(item);
      }
    }
    updateCounters();
  }

  /**
   * SORT Operation - Sort ArrayList by slot number (ascending)
   * Algorithm: JavaScript's built-in sort (Timsort)
   * Time Complexity: O(n log n)
   */
  function sortBySlot(){ 
    arrayList.sort((a,b)=>a.slot-b.slot);
    saveState();
    
    // Visual feedback animation
    const arrayListItems = document.getElementById('arraylist-items');
    arrayListItems.style.opacity = '0.5';
    arrayListItems.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      renderArrayList();
      arrayListItems.style.opacity = '1';
      arrayListItems.style.transform = 'scale(1)';
    }, 150);
  }

  /**
   * SORT Operation - Sort ArrayList by reservation time (oldest first)
   * Time Complexity: O(n log n)
   */
  function sortByTime(){ 
    arrayList.sort((a,b)=>new Date(a.time)-new Date(b.time)); 
    saveState();
    
    const arrayListItems = document.getElementById('arraylist-items');
    arrayListItems.style.opacity = '0.5';
    arrayListItems.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      renderArrayList();
      arrayListItems.style.opacity = '1';
      arrayListItems.style.transform = 'scale(1)';
    }, 150);
  }

  /**
   * TRAVERSE Operation - Reverse the ArrayList order
   * Time Complexity: O(n)
   */
  function traverseReverse(){ 
    arrayList.reverse(); 
    saveState();
    
    const arrayListItems = document.getElementById('arraylist-items');
    arrayListItems.style.opacity = '0.5';
    arrayListItems.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      renderArrayList();
      arrayListItems.style.opacity = '1';
      arrayListItems.style.transform = 'scale(1)';
    }, 150);
  }

  /**
   * INSERT Operation - Add new reservation to ArrayList or Queue
   * Time Complexity: O(1) for ArrayList insertion at end
   * Time Complexity: O(1) for Queue enqueue
   * @param {string} plate - Vehicle plate number
   * @param {string} chosenSlot - Selected slot ("auto" or slot number)
   */
  function insertReservation(plate, chosenSlot){
    // Validation
    if(!plate || plate.trim() === ''){ 
      alert('Please enter a plate number'); 
      return; 
    }
    plate = plate.trim();
    
    // Check for duplicates
    if(arrayList.find(r=>r.plate.toLowerCase()===plate.toLowerCase()) || 
       queue.find(r=>r.plate.toLowerCase()===plate.toLowerCase())){
      alert('Plate already in system (either reserved or queued)');
      return;
    }

    const time = nowString();
    const id = 'id'+Date.now()+Math.floor(Math.random()*999);
    
    // If parking is full, add to queue
    if(arrayList.length >= TOTAL_SLOTS){
      queue.push({plate, time, id}); // ENQUEUE O(1)
      saveState(); 
      renderQueue();
      updateCounters();
      alert(`Parking is full! ${plate} has been added to the waiting queue.`);
      return;
    }

    // Find available slot
    let slotIndex = -1;
    if(chosenSlot === 'auto'){
      slotIndex = parkingSlots.findIndex(s => s === null); // O(n) search
    } else {
      const si = parseInt(chosenSlot,10) - 1;
      if(si < 0 || si >= TOTAL_SLOTS){ 
        alert('Invalid slot chosen'); 
        return; 
      }
      if(parkingSlots[si]){ 
        alert('Chosen slot is occupied'); 
        return; 
      }
      slotIndex = si;
    }
    
    if(slotIndex === -1){
      queue.push({plate,time,id});
      saveState(); 
      renderQueue();
    } else {
      // Insert to ArrayList - O(1) operation
      const reservation = {plate, slot: slotIndex+1, time, id};
      parkingSlots[slotIndex] = {plate, time, id};
      arrayList.push(reservation);
      saveState(); 

      const stickerCode = `SP-${plate}-${String(slotIndex+1).padStart(2,'0')}-${id.substring(2,10).toUpperCase()}`;
      const viewSticker = confirm(`✅ Reservation successful!\n\nPlate: ${plate}\nSlot: ${slotIndex+1}\nSticker Code: ${stickerCode}\n\nView your digital parking sticker?`);

      if(viewSticker){
        localStorage.setItem('currentSticker', JSON.stringify({
          plate: plate,
          slot: slotIndex+1,
          time: time,
          code: stickerCode
        }));
        window.open('sticker.html', '_blank');
      }
    }

    renderGrid();
    renderArrayList();
  }

  // ============================================
  // Queue Operations (FIFO)
  // ============================================

  /**
   * Renders the Queue visualization panel
   * Displays all waiting vehicles in order
   */
  function renderQueue(){
    if(queue.length===0){
      queueEmpty.style.display = 'block';
      queueItems.style.display = 'none';
    } else {
      queueEmpty.style.display = 'none';
      queueItems.style.display = 'block';
      queueItems.innerHTML = '';
      
      queue.forEach((q,i)=>{
        const d = document.createElement('div');
        d.className = 'queue-item';
        d.innerHTML = `
          <div>
            <div class="queue-position">#${i+1}</div>
            <div class="queue-content-right">
              <div class="queue-plate-number">${q.plate}</div>
              <div class="queue-meta">🕐 ${q.time}</div>
            </div>
          </div>
          <div class="queue-status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            WAITING
          </div>
        `;
        queueItems.appendChild(d);
      });
    }
    updateCounters();
  }

  // ============================================
  // Search Operation (Linear Search)
  // ============================================

  /**
   * SEARCH Operation - Linear search through ArrayList
   * Time Complexity: O(n)
   * Searches by plate number or slot number
   * @param {string} term - Search term (plate or slot number)
   */
  function search(term){
    term = (term||'').trim();
    if(!term){ 
      searchResult.innerHTML = ''; 
      return; 
    }

    if(arrayList.length === 0){
      searchResult.innerHTML = `
        <div style="color: #a855f7; font-weight: 600; margin-bottom: 12px; font-size: 13px;">Found 0 result(s) for "${term}"</div>
        <div style="background: linear-gradient(135deg, rgba(150,30,50,0.3), rgba(100,20,40,0.25)); padding: 40px; border-radius: 10px; border: 2px solid rgba(255,75,75,0.5); text-align: center;">
          <div style="font-size: 48px; color: #ff4b4b; margin-bottom: 12px;">✕</div>
          <div style="color: #ff6b6b; font-size: 16px; font-weight: 600;">No reservations found</div>
        </div>
      `;
      return;
    }
    
    // Linear search through ArrayList
    const results = [];
    arrayList.forEach(r=>{
      if(r.plate.toLowerCase().includes(term.toLowerCase()) || String(r.slot)===term) {
        results.push(r);
      }
    });
    
    if(results.length===0){
      searchResult.innerHTML = `
        <div style="color: #a855f7; font-weight: 600; margin-bottom: 12px; font-size: 13px;">Found 0 result(s) for "${term}"</div>
        <div style="background: linear-gradient(135deg, rgba(150,30,50,0.3), rgba(100,20,40,0.25)); padding: 40px; border-radius: 10px; border: 2px solid rgba(255,75,75,0.5); text-align: center;">
          <div style="font-size: 48px; color: #ff4b4b; margin-bottom: 12px;">✕</div>
          <div style="color: #ff6b6b; font-size: 16px; font-weight: 600;">No reservations found</div>
        </div>
      `;
    } else {
      const rows = results.map(r=>`
        <div class="item">
          <div class="slot-badge">#${r.slot}</div>
          <div class="item-content">
            <div class="plate-number">${r.plate}</div>
            <div class="meta">🕐 ${r.time}</div>
          </div>
        </div>
      `).join('');
      searchResult.innerHTML = `<div style="color: #a855f7; font-weight: 600; margin-bottom: 12px; font-size: 13px;">Found ${results.length} result(s) for "${term}"</div>${rows}`;
    }
  }

  // ============================================
  // Event Listeners
  // ============================================
  
  insertBtn.addEventListener('click', ()=>{
    const plate = plateInput.value;
    const slotChoice = slotSelect.value;
    insertReservation(plate, slotChoice);
    plateInput.value = '';
  });

  plateInput.addEventListener('keydown', (e)=> {
    if(e.key==='Enter') {
      insertBtn.click();
    }
  });

  searchBtn.addEventListener('click', ()=> search(searchInput.value));
  searchInput.addEventListener('keydown', (e)=> { 
    if(e.key==='Enter') search(searchInput.value); 
  });

  sortSlotBtn.addEventListener('click', sortBySlot);
  sortTimeBtn.addEventListener('click', sortByTime);
  traverseBtn.addEventListener('click', traverseReverse);

  // ============================================
  // Initialize Application
  // ============================================
  loadState();
  renderGrid();
  renderArrayList();
  renderQueue();

  // Expose data structures to console for debugging
  window.SP = {parkingSlots, arrayList, queue};

})();