"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowDownUp, X, Calendar } from "lucide-react";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

// Define types
interface ClassType {
  id: number;
  name: string;
}

interface AnnouncementType {
  id: number;
  title: string;
  description: string;
  date: string | Date;
  classId: number | null;
  class: ClassType | null;
}

interface AnnouncementListClientWrapperProps {
  initialData: AnnouncementType[];
  userRole?: string;
  classes: ClassType[];
}

const AnnouncementListClientWrapper = ({
  initialData,
  userRole,
  classes,
}: AnnouncementListClientWrapperProps) => {
  // State
  const [data, setData] = useState<AnnouncementType[]>(initialData);
  const [filteredData, setFilteredData] =
    useState<AnnouncementType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showGlobalAnnouncementsOnly, setShowGlobalAnnouncementsOnly] =
    useState<boolean>(false);
  const ITEMS_PER_PAGE = 10;

  // Define columns
  const columns = [
    {
      header: "Título",
      accessor: "title",
      sortable: true,
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden sm:table-cell",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden md:table-cell",
      sortable: true,
    },
    ...(userRole === "admin"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Format date
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Sort function
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Toggle class selection
  const toggleClass = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Toggle global announcements only
  const toggleGlobalAnnouncementsOnly = () => {
    setShowGlobalAnnouncementsOnly(!showGlobalAnnouncementsOnly);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedClasses([]);
    setSelectedDate("");
    setShowGlobalAnnouncementsOnly(false);
    setSearchQuery("");
    setSortConfig({ key: "date", direction: "desc" });
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.class?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter(
        (item) => item.classId && selectedClasses.includes(item.classId)
      );
    }

    // Apply date filter
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);

      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === filterDate.getTime();
      });
    }

    // Apply global announcements only filter
    if (showGlobalAnnouncementsOnly) {
      result = result.filter((item) => item.classId === null);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortConfig.key) {
          case "title":
            valueA = a.title;
            valueB = b.title;
            break;
          case "date":
            valueA = new Date(a.date).getTime();
            valueB = new Date(b.date).getTime();
            break;
          default:
            return 0;
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortConfig.direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc"
            ? valueA - valueB
            : valueB - valueA;
        }

        return 0;
      });
    }

    setFilteredData(result);
  }, [
    data,
    searchQuery,
    sortConfig,
    selectedClasses,
    selectedDate,
    showGlobalAnnouncementsOnly,
  ]);

  // Calculate pagination
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Refresh data after operations
  const refreshData = useCallback(() => {
    setData(initialData);
    setFilteredData(initialData);
    setPage(1);
  }, [initialData]);

  // Effect to set initial data
  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  // Render table row
  const renderRow = (item: AnnouncementType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="p-4">{item.title}</td>
      <td className="hidden sm:table-cell">
        {item.class?.name || "Toda la escuela"}
      </td>
      <td className="hidden md:table-cell">{formatDate(item.date)}</td>
      {userRole === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainerClient
              table="announcement"
              type="update"
              data={{
                ...item,
                date: new Date(item.date).toISOString().slice(0, 10),
              }}
              userRole={userRole}
              relatedData={{ classes }}
              onComplete={refreshData}
            />
            <FormContainerClient
              table="announcement"
              type="delete"
              id={item.id}
              userRole={userRole}
              onComplete={refreshData}
            />
          </div>
        </td>
      )}
    </tr>
  );

  // View announcement details component
  const ViewAnnouncementDetails = ({
    announcement,
  }: {
    announcement: AnnouncementType;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold">{announcement.title}</h2>
      <div className="mt-2 text-gray-600 text-sm">
        {announcement.description}
      </div>
      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-500" />
          <span>{formatDate(announcement.date)}</span>
        </div>
        {announcement.class && (
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
              {announcement.class.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Todos los Anuncios
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} initialQuery={searchQuery} />
          <div className="flex items-center gap-4 self-end">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                showFilters ? "bg-gray-200" : "bg-gray-100"
              } text-gray-500 hover:bg-gray-200 transition-all duration-200`}
              onClick={toggleFilters}
            >
              <SlidersHorizontal
                size={14}
                className={`transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200"
              onClick={() => requestSort("date")}
            >
              <ArrowDownUp
                size={14}
                className={`transition-transform duration-300 ${
                  sortConfig.key === "date"
                    ? sortConfig.direction === "asc"
                      ? "rotate-0"
                      : "rotate-180"
                    : ""
                }`}
              />
            </button>
            {userRole === "admin" && (
              <FormContainerClient
                table="announcement"
                type="create"
                userRole={userRole}
                relatedData={{ classes }}
                onComplete={refreshData}
              />
            )}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-sm border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <SlidersHorizontal size={14} />
              Filtros activos
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          </div>

          <div className="bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Fecha</h4>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md text-sm"
                  />
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Class filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Clases</h4>
                <div className="flex flex-wrap gap-2">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.id}
                      onClick={() => toggleClass(classItem.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedClasses.includes(classItem.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {classItem.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Global announcements only filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Tipo de Anuncio</h4>
                <div>
                  <button
                    onClick={toggleGlobalAnnouncementsOnly}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      showGlobalAnnouncementsOnly
                        ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Solo anuncios globales
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(selectedDate ||
              selectedClasses.length > 0 ||
              showGlobalAnnouncementsOnly ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

                  {selectedDate && (
                    <div className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                      Fecha: {new Date(selectedDate).toLocaleDateString()}
                      <button
                        onClick={() => setSelectedDate("")}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {selectedClasses.map((id) => {
                    const classItem = classes.find((c) => c.id === id);
                    return classItem ? (
                      <div
                        key={`selected-class-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {classItem.name}
                        <button
                          onClick={() => toggleClass(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}

                  {showGlobalAnnouncementsOnly && (
                    <div className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                      Solo anuncios globales
                      <button
                        onClick={toggleGlobalAnnouncementsOnly}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {searchQuery && (
                    <div className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                      Búsqueda: {searchQuery}
                      <button
                        onClick={() => handleSearch("")}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIST */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={paginatedData}
        onSort={requestSort}
        sortConfig={sortConfig}
      />

      {/* PAGINATION */}
      <Pagination
        page={page}
        count={filteredData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AnnouncementListClientWrapper;
