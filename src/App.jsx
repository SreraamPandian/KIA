import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, PlusCircle, FileText, Car, Users, 
  Clock, Navigation, Download, Search, CheckCircle2, 
  ChevronRight, ChevronDown, Menu, X, TrendingUp, MapPin, 
  Settings, Trash2, Gauge, Calendar, Phone, Edit3, Save, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend
} from 'recharts';

// Glassmorphism UI Constants
const glassCard = "bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl overflow-hidden";
const glassInput = "bg-white/40 backdrop-blur-md border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-all outline-none text-slate-800 placeholder-slate-400 rounded-xl px-4 py-3 text-xs font-bold w-full select-none";
const glassButton = "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className={`${glassCard} w-full max-w-md rounded-3xl p-6 lg:p-8 animate-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const CustomSelect = ({ value, onChange, options, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClick = (e) => { 
      if (ref.current && !ref.current.contains(e.target) && 
          (!dropdownRef.current || !dropdownRef.current.contains(e.target))) {
        setIsOpen(false); 
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && ref.current) {
       const rect = ref.current.getBoundingClientRect();
       setCoords({
         top: rect.bottom + window.scrollY,
         left: rect.left + window.scrollX,
         width: rect.width
       });
       
       const handleScroll = () => {
         if (isOpen && ref.current) {
            const newRect = ref.current.getBoundingClientRect();
            setCoords({
               top: newRect.bottom + window.scrollY,
               left: newRect.left + window.scrollX,
               width: newRect.width
            });
         }
       };
       window.addEventListener('scroll', handleScroll, true);
       return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative cursor-pointer ${className}`} ref={ref} onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between w-full h-full">
        <span className={`truncate mr-2 ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ top: coords.top + 4, left: coords.left, width: coords.width }}
          className="absolute bg-white backdrop-blur-5xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {options.length > 0 ? options.map((opt, i) => (
            <div 
              key={i} 
              className={`px-4 py-3 text-xs font-black cursor-pointer rounded-xl transition-colors ${value === opt.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              onClick={(e) => { 
                e.stopPropagation(); 
                onChange({ target: { value: opt.value } }); 
                setIsOpen(false); 
              }}
            >
              {opt.label}
            </div>
          )) : (
            <div className="px-4 py-3 text-xs text-slate-400 italic text-center">No options available</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {icon}
    {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>}
  </button>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Form States
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [newVehicle, setNewVehicle] = useState({ name: '', plate: '', currentMeter: '' });
  const [newDriver, setNewDriver] = useState({ name: '', phone: '' });
  const [newLocation, setNewLocation] = useState({ name: '' });

  const [formData, setFormData] = useState({ 
    customerName: '', phone: '', vehicle: '', meterStart: '', fromLocation: '', toLocation: '', driverName: '', date: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Local Data Sync & Dummy Seeding
  useEffect(() => {
    const savedVehicles = localStorage.getItem('kia_vehicles');
    const savedDrivers = localStorage.getItem('kia_drivers');
    const savedLocations = localStorage.getItem('kia_locations');
    const savedRecords = localStorage.getItem('kia_records');

    if (savedVehicles && savedDrivers && savedLocations && savedRecords) {
        setVehicles(JSON.parse(savedVehicles));
        setDrivers(JSON.parse(savedDrivers));
        setLocations(JSON.parse(savedLocations));
        setRecords(JSON.parse(savedRecords));
        setLoading(false);
        return;
    }

    const initialVehicles = [
      { id: 'v1', name: 'Nexon EV Dark', plate: 'KA-01-EV-1234', currentMeter: 1250 },
      { id: 'v2', name: 'Safari Adventure', plate: 'MH-12-SA-9988', currentMeter: 4500 },
      { id: 'v3', name: 'Harrier Red Edition', plate: 'DL-04-HR-7766', currentMeter: 820 },
      { id: 'v4', name: 'Punch Camos', plate: 'TN-09-PC-1122', currentMeter: 310 }
    ];

    const initialDrivers = [
      { id: 'd1', name: 'Rajesh K.', phone: '9876543210' }, 
      { id: 'd2', name: 'Suresh M.', phone: '9123456789' },
      { id: 'd3', name: 'Anita P.', phone: '9000100020' }
    ];

    const initialLocations = [
      { id: 'l1', name: 'Showroom' },
      { id: 'l2', name: 'City Center' },
      { id: 'l3', name: 'Highway Check' },
      { id: 'l4', name: 'Industrial Area' }
    ];

    const initialHistory = [];
    const pastDays = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 6, 6, 7];
    pastDays.forEach((day, index) => {
      const d = new Date();
      d.setDate(d.getDate() - day);
      initialHistory.push({
        id: `rec-${index}`,
        customerName: `Customer ${index + 100}`,
        phone: '98000000' + index.toString().padStart(2, '0'),
        vehicle: initialVehicles[index % initialVehicles.length].name,
        meterStart: 1200 + (index * 15),
        meterEnd: 1200 + (index * 15) + (Math.floor(Math.random() * 20) + 5),
        totalKM: Math.floor(Math.random() * 20) + 5,
        fromLocation: 'Showroom',
        toLocation: 'City Center',
        status: 'Completed',
        startTime: '10:30 AM',
        endTime: '11:15 AM',
        driverName: initialDrivers[index % initialDrivers.length].name,
        createdAt: d.getTime(), 
        date: d.toLocaleDateString()
      });
    });

    initialHistory.unshift({
      id: `rec-active-1`,
      customerName: 'Anil Kumar',
      phone: '9988776655',
      vehicle: 'Nexon EV Dark',
      meterStart: 1250,
      meterEnd: '',
      totalKM: 0,
      fromLocation: 'Showroom',
      toLocation: 'Highway Check',
      status: 'Active',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      driverName: 'Rajesh K.',
      createdAt: new Date().getTime(),
      date: new Date().toLocaleDateString()
    });

    setVehicles(initialVehicles);
    setDrivers(initialDrivers);
    setLocations(initialLocations);
    setRecords(initialHistory);
    
    localStorage.setItem('kia_vehicles', JSON.stringify(initialVehicles));
    localStorage.setItem('kia_drivers', JSON.stringify(initialDrivers));
    localStorage.setItem('kia_locations', JSON.stringify(initialLocations));
    localStorage.setItem('kia_records', JSON.stringify(initialHistory));

    setLoading(false);
  }, []);

  // Sync to localstorage
  useEffect(() => { if (!loading) localStorage.setItem('kia_vehicles', JSON.stringify(vehicles)); }, [vehicles, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('kia_drivers', JSON.stringify(drivers)); }, [drivers, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('kia_locations', JSON.stringify(locations)); }, [locations, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('kia_records', JSON.stringify(records)); }, [records, loading]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const active = records.filter(r => r.status === 'Active');
    const totalKM = records.reduce((acc, curr) => acc + (Number(curr.totalKM) || 0), 0);
    const chart = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toLocaleDateString();
      const count = records.filter(r => r.date === ds).length;
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), count };
    }).reverse();
    return { todayCount: records.filter(r => r.date === today).length, activeCount: active.length, totalKM, chart };
  }, [records]);

  // Handlers
  const handleStartDrive = (e) => {
    e.preventDefault();
    if (!formData.vehicle) return;
    
    let localDateStr = new Date().toLocaleDateString();
    if (formData.date) {
      const [year, month, day] = formData.date.split('-');
      localDateStr = new Date(year, month - 1, day).toLocaleDateString();
    }
    
    const newRecord = {
      ...formData,
      id: `rec-${Date.now()}`,
      meterStart: formData.meterStart,
      status: 'Active',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      totalKM: 0,
      createdAt: Date.now(),
      date: localDateStr
    };
    
    setRecords(prev => [newRecord, ...prev]);
    setFormData({ customerName: '', phone: '', vehicle: '', meterStart: '', fromLocation: '', toLocation: '', driverName: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAddVehicle = () => {
    if (!newVehicle.name || !newVehicle.currentMeter) return;
    const newV = {
      ...newVehicle,
      id: `v-${Date.now()}`,
      currentMeter: parseFloat(newVehicle.currentMeter)
    };
    setVehicles(prev => [...prev, newV]);
    setNewVehicle({ name: '', plate: '', currentMeter: '' });
    setShowVehicleModal(false);
  };
  
  const handleAddDriver = () => {
    if (!newDriver.name || !newDriver.phone) return;
    const newD = {
      ...newDriver,
      id: `d-${Date.now()}`
    };
    setDrivers(prev => [...prev, newD]);
    setNewDriver({ name: '', phone: '' });
    setShowDriverModal(false);
  };

  const handleAddLocation = () => {
    if (!newLocation.name) return;
    const newL = {
      ...newLocation,
      id: `l-${Date.now()}`
    };
    setLocations(prev => [...prev, newL]);
    setNewLocation({ name: '' });
    setShowLocationModal(false);
  };

  const handleEditRecord = (record) => {
    setEditingRecordId(record.id);
    setEditFormData({ ...record });
  };

  const saveEditedRecord = () => {
    let finalUpdate = { ...editFormData };
    if (editFormData.meterEnd && editFormData.meterStart) {
       finalUpdate.totalKM = parseFloat(editFormData.meterEnd) - parseFloat(editFormData.meterStart);
    }
    setRecords(prev => prev.map(r => r.id === editingRecordId ? { ...r, ...finalUpdate } : r));
    setEditingRecordId(null);
  };

  const downloadExcel = () => {
    const headers = "Date,Customer,Phone,Vehicle,Advisor,From,To,Start Meter,End Meter,Total KM,Status,Time In,Time Out";
    const rows = records.map(r => 
      `"${r.date}","${r.customerName}","${r.phone}","${r.vehicle}","${r.driverName}","${r.fromLocation || ''}","${r.toLocation || ''}","${r.meterStart}","${r.meterEnd || ''}","${r.totalKM}","${r.status}","${r.startTime}","${r.endTime || ''}"`
    ).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + headers + "\n" + rows);
    link.download = `autolog_full_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  if (loading) return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8FAFC]">
      <Car size={48} className="animate-bounce text-blue-500 mb-4" />
      <h2 className="font-black uppercase tracking-widest text-sm text-slate-800">System Initializing...</h2>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 p-4 transition-all duration-300 flex flex-col z-20 relative flex-shrink-0`}>
        <div className="flex items-center gap-3 mb-10 px-4 mt-4">
          <div className="min-w-[40px] w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Car size={20} />
          </div>
          {sidebarOpen && <h1 className="font-black text-xl tracking-tighter text-slate-800 whitespace-nowrap">Auto<span className="text-blue-500">Log</span></h1>}
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} className="flex-shrink-0"/>} label="Dashboard" collapsed={!sidebarOpen} />
          <NavItem active={activeTab === 'entry'} onClick={() => setActiveTab('entry')} icon={<PlusCircle size={18} className="flex-shrink-0"/>} label="Test Drive" collapsed={!sidebarOpen} />
          <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={18} className="flex-shrink-0"/>} label="Log Book" collapsed={!sidebarOpen} />
          <NavItem active={activeTab === 'masters'} onClick={() => setActiveTab('masters')} icon={<Settings size={18} className="flex-shrink-0"/>} label="Management" collapsed={!sidebarOpen} />
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 flex justify-center text-slate-400 hover:text-blue-500 border-t border-slate-100 mt-auto">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col p-4 md:p-6 w-full z-10">
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operational Environment • Live</p>
          </div>
          <div className={`${glassCard} px-5 py-2.5 rounded-xl flex items-center gap-3`}>
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase">System Status</p>
                <p className="text-[11px] lg:text-xs font-black text-green-600">All Nodes Online</p>
             </div>
             <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-500"><CheckCircle2 size={14} /></div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden pb-1">
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col gap-4 lg:gap-5 animate-in fade-in duration-500 w-full h-full min-h-0">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 flex-shrink-0">
                {[
                  { label: 'Today Dispatches', val: stats.todayCount, icon: <Users />, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Vehicles Out', val: stats.activeCount, icon: <Navigation />, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Total Test KM', val: stats.totalKM.toFixed(0), icon: <Gauge />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Fleet Access', val: vehicles.length, icon: <Car />, color: 'text-purple-500', bg: 'bg-purple-50' },
                  { label: 'Locations', val: locations.length, icon: <MapPin />, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((s, i) => (
                  <div key={i} className={`${glassCard} p-4 lg:p-5 rounded-[1.5rem] flex items-center gap-4 hover:scale-[1.01] transition-transform w-full`}>
                    <div className={`p-3 lg:p-4 rounded-xl ${s.bg} ${s.color} hidden sm:block`}>{React.cloneElement(s.icon, { size: 24 })}</div>
                    <div>
                      <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-0.5">{s.label}</p>
                      <p className="text-xl lg:text-2xl font-black text-slate-800">{s.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 flex-1 min-h-0 pb-[10px]">
                <div className={`${glassCard} p-5 lg:p-7 rounded-[1.5rem] flex flex-col flex-[2] min-h-0 h-full`}>
                  <div className="flex-shrink-0 mb-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1"><TrendingUp size={16}/> Activity Distribution</h3>
                    <p className="text-[10px] font-bold text-slate-400">Daily dispatches over the last 7 days</p>
                  </div>
                  <div className="flex-1 w-full min-h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} dx={-10} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '11px', padding: '8px 12px' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} name="Drives Conducted" animationDuration={800}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className={`${glassCard} p-5 lg:p-7 rounded-[1.5rem] flex flex-col flex-1 min-h-0 h-full`}>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex-shrink-0">Recent Fleet Events</h3>
                  <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                    {records.slice(0, 10).map((r, i) => (
                      <div key={i} className="p-3 lg:p-4 rounded-[1rem] bg-white/40 border border-slate-100 flex items-center gap-3 hover:shadow-sm transition-shadow shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner flex-shrink-0 ${r.status === 'Active' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] lg:text-xs font-black text-slate-800 truncate leading-tight mb-0.5">{r.customerName}</p>
                          <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">{r.vehicle} • {r.status}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[9px] lg:text-[10px] font-bold text-slate-500 leading-tight mb-0.5">{r.startTime}</p>
                          <p className="text-[8px] lg:text-[9px] font-bold text-slate-400">{r.date}</p>
                        </div>
                      </div>
                    ))}
                    {records.length === 0 && <p className="text-xs text-slate-400 italic text-center mt-6">No recent activity</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entry' && (
            <div className="flex-1 flex flex-col gap-4 lg:gap-5 animate-in slide-in-from-bottom-4 duration-500 w-full h-full min-h-0">
              <div className={`${glassCard} p-5 lg:p-6 rounded-[1.5rem] flex-shrink-0 w-full`}>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <PlusCircle size={16} className="text-blue-600" /> New Dispatch Request
                </h3>
                <form onSubmit={handleStartDrive} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                  <input type="date" className={glassInput} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  <input className={glassInput} placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
                  <input className={glassInput} placeholder="Contact Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  
                  <CustomSelect 
                    className={glassInput}
                    value={formData.vehicle}
                    onChange={e => {
                      const val = e.target.value;
                      const v = vehicles.find(veh => veh.name === val);
                      setFormData({...formData, vehicle: val, meterStart: v ? v.currentMeter : ''});
                    }}
                    options={vehicles.map(v => ({ value: v.name, label: `${v.name} (${v.plate})` }))}
                    placeholder="Select Vehicle"
                  />

                  <input type="number" className={glassInput} placeholder="Start Meter" value={formData.meterStart} onChange={e => setFormData({...formData, meterStart: e.target.value})} required />
                  
                  <div className="relative w-full">
                    <input list="from-locations" className={glassInput} placeholder="Pickup Location (Optional)" value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} />
                    <datalist id="from-locations">
                      {locations.map(l => <option key={l.id} value={l.name} />)}
                    </datalist>
                  </div>
                  
                  <div className="relative w-full">
                    <input list="to-locations" className={glassInput} placeholder="Destination (Optional)" value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})} />
                    <datalist id="to-locations">
                      {locations.map(l => <option key={l.id} value={l.name} />)}
                    </datalist>
                  </div>
                  
                  <CustomSelect 
                    className={glassInput}
                    value={formData.driverName}
                    onChange={e => setFormData({...formData, driverName: e.target.value})}
                    options={drivers.map(d => ({ value: d.name, label: d.name }))}
                    placeholder="Assigned Staff"
                  />

                  <button type="submit" className={`${glassButton} bg-slate-900 text-white w-full h-full min-h-[44px] hover:bg-slate-800 text-xs sm:col-span-2 xl:col-span-4`}>Authorize</button>
                </form>
              </div>

              <div className={`${glassCard} p-5 lg:p-6 rounded-[1.5rem] flex-1 min-h-0 w-full flex flex-col mb-1`}>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 flex-shrink-0">
                  <Clock size={16} className="text-amber-500" /> Currently Tracking (Live)
                </h3>
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar w-full relative min-h-0 border border-slate-100 rounded-xl bg-white/30">
                  <table className="w-full text-left whitespace-nowrap min-w-max">
                    <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 text-[9px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Vehicle & Staff</th>
                        <th className="px-5 py-4">Customer Info</th>
                        <th className="px-5 py-4">Routing</th>
                        <th className="px-5 py-4">Meter Out</th>
                        <th className="px-5 py-4">Meter In (End)</th>
                        <th className="px-5 py-4 text-right sticky right-0 bg-slate-50/90 backdrop-blur-md w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] lg:text-[11px]">
                      {records.filter(r => r.status === 'Active').map(r => (
                        <tr key={r.id} className={`${editingRecordId === r.id ? 'bg-blue-50/20 shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]' : 'hover:bg-slate-50/30'} transition-all`}>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                              <div className="flex flex-col gap-2 min-w-[130px]">
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.vehicle}
                                    onChange={e => setEditFormData({...editFormData, vehicle: e.target.value})}
                                    options={vehicles.map(v => ({ value: v.name, label: v.name }))}
                                    placeholder="Vehicle"
                                 />
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.driverName}
                                    onChange={e => setEditFormData({...editFormData, driverName: e.target.value})}
                                    options={drivers.map(d => ({ value: d.name, label: d.name }))}
                                    placeholder="Staff"
                                 />
                              </div>
                            ) : (
                              <div>
                                <p className="font-extrabold text-blue-600 mb-0.5">{r.vehicle}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Staff: {r.driverName}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                               <div className="flex flex-col gap-2 min-w-[130px]">
                                 <input className={`${glassInput} py-2 px-3 text-[10px]`} placeholder="Customer Name" value={editFormData.customerName} onChange={e => setEditFormData({...editFormData, customerName: e.target.value})} />
                                 <input className={`${glassInput} py-2 px-3 text-[10px]`} placeholder="Phone Number" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                               </div>
                            ) : (
                               <div>
                                 <p className="font-extrabold text-slate-800 mb-0.5">{r.customerName}</p>
                                 <p className="text-[9px] text-slate-500 font-bold font-mono">{r.phone}</p>
                               </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                               <div className="flex flex-col gap-2 min-w-[120px]">
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.fromLocation}
                                    onChange={e => setEditFormData({...editFormData, fromLocation: e.target.value})}
                                    options={locations.map(l => ({ value: l.name, label: l.name }))}
                                    placeholder="From Location"
                                 />
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.toLocation}
                                    onChange={e => setEditFormData({...editFormData, toLocation: e.target.value})}
                                    options={locations.map(l => ({ value: l.name, label: l.name }))}
                                    placeholder="To Destination"
                                 />
                               </div>
                            ) : (
                               <div className="space-y-1.5">
                                 <p className="text-[9px] text-slate-600 font-bold flex items-center gap-1.5"><MapPin size={10} className="text-slate-400"/> {r.fromLocation || 'Direct'}</p>
                                 <p className="text-[9px] text-slate-600 font-bold flex items-center gap-1.5"><Navigation size={10} className="text-blue-400"/> {r.toLocation || 'Route Unset'}</p>
                               </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                             {editingRecordId === r.id ? (
                               <div className="flex flex-col gap-2 min-w-[100px]">
                                 <input className={`${glassInput} py-2 px-3 text-[10px] bg-slate-50`} placeholder="Meter Out" value={editFormData.meterStart} onChange={e => setEditFormData({...editFormData, meterStart: e.target.value})} />
                                 <div className="h-[31px] opacity-0" />
                               </div>
                             ) : (
                               <div>
                                 <p className="font-extrabold text-slate-800">{r.meterStart} <span className="text-[8px] text-slate-400">KM</span></p>
                                 <p className="text-[9px] text-slate-500 font-bold mt-0.5">{r.startTime}</p>
                               </div>
                             )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                             {editingRecordId === r.id ? (
                               <div className="flex flex-col gap-2 min-w-[110px]">
                                 <input className={`${glassInput} py-2 px-3 text-[10px] bg-amber-50 border-amber-200 focus-within:border-amber-400 text-amber-900 placeholder-amber-400 ${!editFormData.meterEnd ? 'animate-pulse focus-within:animate-none' : ''}`} placeholder="Meter In..." value={editFormData.meterEnd || ''} onChange={e => setEditFormData({...editFormData, meterEnd: e.target.value})} />
                                 <div className="h-[31px] opacity-0" />
                               </div>
                             ) : (
                               <div className="flex items-center h-full">
                                 <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded animate-pulse">Awaiting Return</span>
                               </div>
                             )}
                          </td>
                          <td className="px-5 py-3 align-middle text-right sticky right-0 bg-white/70 backdrop-blur-md border-l border-slate-100">
                             {editingRecordId === r.id ? (
                               <div className="flex flex-col justify-stretch h-full gap-2">
                                 <button onClick={() => {
                                   const finalObj = { ...editFormData };
                                   if (finalObj.meterEnd && parseFloat(finalObj.meterEnd) >= parseFloat(finalObj.meterStart)) {
                                       finalObj.status = 'Completed';
                                       finalObj.totalKM = parseFloat(finalObj.meterEnd) - parseFloat(finalObj.meterStart);
                                       finalObj.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                       setVehicles(prev => prev.map(v => v.name === finalObj.vehicle ? { ...v, currentMeter: finalObj.meterEnd } : v));
                                   } else if (finalObj.meterEnd && parseFloat(finalObj.meterEnd) < parseFloat(finalObj.meterStart)) {
                                       alert("Meter In cannot be less than Meter Out.");
                                       return;
                                   }
                                   setRecords(prev => prev.map(record => record.id === editingRecordId ? { ...record, ...finalObj } : record));
                                   setEditingRecordId(null);
                                 }} className={`${glassButton} h-full min-h-[70px] flex flex-col items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-emerald-200 rounded-xl w-full text-[9px] tracking-wider`}><Save size={16} className="mb-1 mr-0"/><span className="leading-none">SAVE</span></button>
                               </div>
                             ) : (
                               <button onClick={() => handleEditRecord(r)} className={`${glassButton} p-2 h-[34px] flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shadow-none rounded-lg w-full text-[9px] tracking-wider`}><Edit3 size={12} className="mr-1"/> Update</button>
                             )}
                          </td>
                        </tr>
                      ))}
                      {records.filter(r => r.status === 'Active').length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <CheckCircle2 size={32} className="text-slate-300"/>
                              All fleet nodes secured at base
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col gap-4 lg:gap-5 animate-in fade-in duration-500 w-full h-full min-h-0">
              <div className={`${glassCard} p-4 lg:p-5 rounded-[1.5rem] flex items-center justify-between gap-4 flex-wrap flex-shrink-0 w-full`}>
                <div className="relative flex-1 min-w-[200px] max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className={`${glassInput} pl-10 h-[40px] text-xs`} placeholder="Search queries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
                <button onClick={downloadExcel} className={`${glassButton} bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white min-w-[140px] h-[40px] text-[9px]`}>
                  <Download size={14}/> Export
                </button>
              </div>

              <div className={`${glassCard} rounded-[1.5rem] overflow-hidden flex-1 flex flex-col min-h-0 w-full mb-1`}>
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar w-full relative min-h-0">
                  <table className="w-full text-left whitespace-nowrap min-w-max">
                    <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 text-[9px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Date Info</th>
                        <th className="px-5 py-4">Client Contact</th>
                        <th className="px-5 py-4">Vehicle & Advisor</th>
                        <th className="px-5 py-4">Routing</th>
                        <th className="px-5 py-4">Meter Statistics</th>
                        <th className="px-5 py-4">Status / Timeline</th>
                        <th className="px-5 py-4 text-right sticky right-0 bg-slate-50/90 backdrop-blur-md w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] lg:text-[11px]">
                      {records
                        .filter(r => 
                          r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.phone?.includes(searchTerm)
                        )
                        .map((r) => (
                        <tr key={r.id} className={`${editingRecordId === r.id ? 'bg-blue-50/20 shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]' : 'hover:bg-slate-50/30'} transition-all`}>
                          <td className="px-5 py-3 align-middle">
                              <div className="pt-0.5">
                                <p className="font-extrabold text-slate-800">{r.date}</p>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(r.createdAt).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                              </div>
                          </td>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                              <div className="flex flex-col gap-2 min-w-[120px]">
                                 <input className={`${glassInput} py-2 px-3 text-[10px]`} value={editFormData.customerName} onChange={e => setEditFormData({...editFormData, customerName: e.target.value})} placeholder="Name" />
                                 <input className={`${glassInput} py-2 px-3 text-[10px]`} value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} placeholder="Phone" />
                              </div>
                            ) : (
                              <div className="pt-0.5">
                                <p className="font-extrabold text-slate-800">{r.customerName}</p>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5">{r.phone}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                              <div className="flex flex-col gap-2 min-w-[130px]">
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.vehicle}
                                    onChange={e => setEditFormData({...editFormData, vehicle: e.target.value})}
                                    options={vehicles.map(v => ({ value: v.name, label: v.name }))}
                                    placeholder="Select Vehicle"
                                 />
                                 <CustomSelect 
                                    className={`${glassInput} py-2 px-3 text-[10px]`}
                                    value={editFormData.driverName}
                                    onChange={e => setEditFormData({...editFormData, driverName: e.target.value})}
                                    options={drivers.map(d => ({ value: d.name, label: d.name }))}
                                    placeholder="Select Staff"
                                 />
                              </div>
                            ) : (
                              <div className="pt-0.5">
                                <p className="font-extrabold text-blue-600">{r.vehicle}</p>
                                <p className="text-[8px] lg:text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Staff: <span className="text-slate-700 ml-1">{r.driverName}</span></p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle text-slate-600 font-bold text-[9px] uppercase tracking-wider min-w-[120px]">
                             {editingRecordId === r.id ? (
                                <div className="flex flex-col gap-2">
                                  <CustomSelect 
                                     className={`${glassInput} py-2 px-3 text-[10px]`}
                                     value={editFormData.fromLocation}
                                     onChange={e => setEditFormData({...editFormData, fromLocation: e.target.value})}
                                     options={locations.map(l => ({ value: l.name, label: l.name }))}
                                     placeholder="From"
                                  />
                                  <CustomSelect 
                                     className={`${glassInput} py-2 px-3 text-[10px]`}
                                     value={editFormData.toLocation}
                                     onChange={e => setEditFormData({...editFormData, toLocation: e.target.value})}
                                     options={locations.map(l => ({ value: l.name, label: l.name }))}
                                     placeholder="To"
                                  />
                                </div>
                             ) : (
                               <div className="flex flex-col gap-1.5 pt-0.5 border-l-2 border-slate-200 pl-2">
                                 <div className="flex items-center gap-1.5"><MapPin size={9} className="text-slate-400"/> {r.fromLocation || 'Direct'}</div>
                                 <div className="flex items-center gap-1.5"><Navigation size={9} className="text-blue-400"/> {r.toLocation || 'Route Demo'}</div>
                               </div>
                             )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                            {editingRecordId === r.id ? (
                               <div className="flex gap-2 min-w-[130px]">
                                 <div className="flex-1">
                                   <input className={`${glassInput} py-2 px-3 text-[10px] bg-slate-50`} placeholder="Start" value={editFormData.meterStart} onChange={e => setEditFormData({...editFormData, meterStart: e.target.value})} />
                                   <div className="h-[31px] opacity-0" />
                                 </div>
                                 <div className="flex-1">
                                   <input className={`${glassInput} py-2 px-3 text-[10px]`} placeholder="End" value={editFormData.meterEnd || ''} onChange={e => setEditFormData({...editFormData, meterEnd: e.target.value})} />
                                   <div className="h-[31px] opacity-0" />
                                 </div>
                               </div>
                            ) : (
                              <div className="pt-0.5">
                                 <p className="font-extrabold text-slate-800 text-xs">{r.totalKM} <span className="text-slate-400 text-[8px]">KM</span></p>
                                 <p className="text-[8px] text-slate-500 font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1 tracking-widest">{r.meterStart} ➔ {r.meterEnd || '...'}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle w-44">
                            {editingRecordId === r.id ? (
                              <div className="flex flex-col gap-2 min-w-[160px]">
                                <CustomSelect 
                                   className={`${glassInput} py-2 px-3 text-[10px]`}
                                   value={editFormData.status}
                                   onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                                   options={statusOptions}
                                   placeholder="Update Status"
                                />
                                <div className="flex gap-2">
                                  <input className={`${glassInput} py-2 px-3 text-[10px] flex-1 min-w-[60px]`} placeholder="Time In" value={editFormData.startTime} onChange={e => setEditFormData({...editFormData, startTime: e.target.value})} />
                                  <input className={`${glassInput} py-2 px-3 text-[10px] flex-1 min-w-[60px]`} placeholder="Time Out" value={editFormData.endTime || ''} onChange={e => setEditFormData({...editFormData, endTime: e.target.value})} />
                                </div>
                              </div>
                            ) : (
                              <div className="pt-0.5">
                                 <span className={`px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${r.status === 'Active' ? 'bg-amber-100/80 text-amber-600' : 'bg-emerald-100/80 text-emerald-600'}`}>Node: {r.status}</span>
                                 <p className="text-[9px] text-slate-500 font-bold mt-1.5 flex items-center gap-1"><Clock size={9} className="text-slate-400"/> {r.startTime} ➔ {r.endTime || 'Ongoing'}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle text-right sticky right-0 bg-white/70 backdrop-blur-md border-l border-slate-100 w-24">
                            {editingRecordId === r.id ? (
                              <button onClick={saveEditedRecord} className={`${glassButton} h-full min-h-[70px] flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-none rounded-xl ml-auto w-[60px]`}><Save size={16} className="mr-0 mb-1"/><span className="leading-none text-[8px]">SAVE</span></button>
                            ) : (
                              <button onClick={() => handleEditRecord(r)} className={`${glassButton} p-2 w-[60px] h-[34px] flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-none rounded-lg ml-auto`}><Edit3 size={12} className="mr-1"/> Edit</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'masters' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5 flex-1 min-h-0 animate-in fade-in duration-500 w-full h-full pb-1">
               <div className={`${glassCard} rounded-[1.5rem] p-5 lg:p-7 flex flex-col border-t-[4px] border-t-blue-500 w-full h-full min-h-0`}>
                  <div className="flex justify-between items-center mb-5 flex-shrink-0">
                    <div>
                      <h3 className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-0.5"><Car size={16} className="text-blue-500"/> Vehicle Management</h3>
                      <p className="text-[9px] font-bold text-slate-400">Track and manage fleet existing meter data</p>
                    </div>
                    <button onClick={() => setShowVehicleModal(true)} className={`${glassButton} bg-slate-900 shadow-slate-300 text-white hover:bg-slate-800 h-[36px] px-4 text-[9px] py-1`}>
                      <PlusCircle size={14}/> Add Unit
                    </button>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
                    {vehicles.map((v) => (
                      <div key={v.id} className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-100 flex justify-between items-center hover:shadow-sm transition-shadow hover:border-blue-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                             <Car size={18}/>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-sm mb-1 tracking-tight truncate">{v.name}</p>
                            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded inline-block truncate">{v.plate}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-blue-600 mb-0.5">{v.currentMeter} KM</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-tight">Odometer</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className={`${glassCard} rounded-[1.5rem] p-5 lg:p-7 flex flex-col border-t-[4px] border-t-amber-500 w-full h-full min-h-0`}>
                  <div className="flex justify-between items-center mb-5 flex-shrink-0">
                    <div>
                      <h3 className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-0.5"><Users size={16} className="text-amber-500"/> Staff Directory</h3>
                      <p className="text-[9px] font-bold text-slate-400">Manage driving and dispatch advisors</p>
                    </div>
                    <button onClick={() => setShowDriverModal(true)} className={`${glassButton} bg-white text-slate-800 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 h-[36px] px-4 text-[9px] py-1`}>
                      <PlusCircle size={14}/> Add Staff
                    </button>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
                    {drivers.map((d) => (
                      <div key={d.id} className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[10px] flex items-center justify-center text-amber-600 font-black text-sm shadow-inner uppercase flex-shrink-0">
                             {d.name.charAt(0)}
                           </div>
                           <p className="font-black text-slate-800 text-xs tracking-tight truncate">{d.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-shrink-0">
                          <Phone size={10}/>
                          <p className="text-[10px] font-bold font-mono tracking-wider">{d.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className={`${glassCard} rounded-[1.5rem] p-5 lg:p-7 flex flex-col border-t-[4px] border-t-rose-500 w-full h-full min-h-0`}>
                  <div className="flex justify-between items-center mb-5 flex-shrink-0">
                    <div>
                      <h3 className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-0.5"><MapPin size={16} className="text-rose-500"/> Locations</h3>
                      <p className="text-[9px] font-bold text-slate-400">Manage common driving routes</p>
                    </div>
                    <button onClick={() => setShowLocationModal(true)} className={`${glassButton} bg-white text-slate-800 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 h-[36px] px-4 text-[9px] py-1`}>
                      <PlusCircle size={14}/> Add Location
                    </button>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
                    {locations.map((l) => (
                      <div key={l.id} className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-gradient-to-br from-rose-50 to-rose-100 rounded-[10px] flex items-center justify-center text-rose-600 shadow-inner flex-shrink-0">
                             <MapPin size={16}/>
                           </div>
                           <p className="font-black text-slate-800 text-xs tracking-tight truncate">{l.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>

        <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title="Register New Location">
           <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Location Name</label>
               <input className={glassInput} placeholder="Enter location name" value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} />
             </div>
             <button onClick={handleAddLocation} className={`${glassButton} bg-rose-500 hover:bg-rose-600 text-white w-full mt-2 h-12 shadow-rose-200 text-xs`}>Add Location</button>
           </div>
        </Modal>

        <Modal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="Register New Vehicle">
           <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Model Name</label>
               <input className={glassInput} placeholder="(e.g. Nexon EV Dark)" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Registration Board Number</label>
               <input className={glassInput} placeholder="(e.g. KA-01-XX-0000)" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Initial Meter Reading (KM)</label>
               <input className={glassInput} type="number" placeholder="Enter starting kilometers" value={newVehicle.currentMeter} onChange={e => setNewVehicle({...newVehicle, currentMeter: e.target.value})} />
             </div>
             <button onClick={handleAddVehicle} className={`${glassButton} bg-blue-600 hover:bg-blue-700 text-white w-full mt-2 h-12 shadow-blue-200 text-xs`}>Save Unit to Fleet</button>
           </div>
        </Modal>

        <Modal isOpen={showDriverModal} onClose={() => setShowDriverModal(false)} title="Register New Staff">
           <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Full Name</label>
               <input className={glassInput} placeholder="Enter full name" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Phone Contact</label>
               <input className={glassInput} placeholder="Enter 10-digit number" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} />
             </div>
             <button onClick={handleAddDriver} className={`${glassButton} bg-amber-500 hover:bg-amber-600 text-white w-full mt-2 h-12 shadow-amber-200 text-xs`}>Add Staff Member</button>
           </div>
        </Modal>
      </main>
    </div>
  );
};

export default App;
