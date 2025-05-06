"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, X, UserRound } from "lucide-react";
import Link from "next/link";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

type StudentType = {
  id: string;
  name: string;
};

type ParentType = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  img?: string;
  students: StudentType[];
};

interface ParentListClientWrapperProps {
  initialData: ParentType[];
  userRole?: string;
}

const ParentListClientWrapper = ({
  initialData,
  userRole,
}: ParentListClientWrapperProps) => {
  const [data, setData] = useState<ParentType[]>(initialData);
  const [filteredData, setFilteredData] = useState<ParentType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 10;

  const columns = [
    { header: "Información", accessor: "info" },
    {
      header: "Estudiantes",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    { header: "Correo", accessor: "email", className: "hidden md:table-cell" },
    {
      header: "Teléfono",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Dirección",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(userRole === "admin"
      ? [{ header: "Acciones", accessor: "action" }]
      : []),
  ];

  // Search
  useEffect(() => {
    let result = [...data];
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
  }, [data, searchQuery]);

  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const refreshData = useCallback(() => {
    setData(initialData);
    setFilteredData(initialData);
    setPage(1);
  }, [initialData]);

  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  const renderRow = (item: ParentType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {item.img ? (
            <img
              src={item.img}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserRound size={24} className="text-gray-500" />
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.students.map((s) => s.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">{item.email}</td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">{item.address}</td>
      {userRole === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/parents/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200">
                <Eye size={16} />
              </button>
            </Link>
            <FormContainerClient
              table="parent"
              type="update"
              data={item}
              userRole={userRole}
              onComplete={refreshData}
            />
            <FormContainerClient
              table="parent"
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Todos los Padres
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={setSearchQuery} initialQuery={searchQuery} />
          <div className="flex items-center gap-4 self-end">
            {userRole === "admin" && (
              <FormContainerClient
                table="parent"
                type="create"
                userRole={userRole}
                onComplete={refreshData}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={paginatedData} />
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

export default ParentListClientWrapper;
