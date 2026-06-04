"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  PaginationState,
  Row,
} from "@tanstack/react-table";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MoreHorizontalIcon, SearchIcon, XIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddInstitutionDialog } from "./add-institution-dialog";
import { EditInstitutionDialog } from "./edit-institution-dialog";
import { DeleteInstitutionDialog } from "./delete-institution-dialog";

interface Institution {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface InstitutionsTableProps {
  initialPage?: number;
  initialLimit?: number;
}

function ActionsCell({
  row,
  onSuccess,
}: {
  row: Row<Institution>;
  onSuccess: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size="icon" variant="ghost">
          <MoreHorizontalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <EditInstitutionDialog
          institutionId={row.original.id}
          initialName={row.original.name}
          onSuccess={onSuccess}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Edit
          </DropdownMenuItem>
        </EditInstitutionDialog>
        <DropdownMenuSeparator />
        <DeleteInstitutionDialog
          institutionId={row.original.id}
          institutionName={row.original.name}
          onSuccess={onSuccess}
        >
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => e.preventDefault()}
          >
            Delete
          </DropdownMenuItem>
        </DeleteInstitutionDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InstitutionsTable({
  initialPage = 1,
  initialLimit = 10,
}: InstitutionsTableProps) {
  const [data, setData] = useState<Institution[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: initialPage - 1,
    pageSize: initialLimit,
  });

  const fetchInstitutions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/institutes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch institutions");

      const result = await response.json();
      setData(result.data);
      setTotalRecords(result.meta?.totalRowCount ?? result.total ?? 0);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  }, [pageIndex, pageSize, searchQuery]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const columns = useMemo<ColumnDef<Institution>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 35,
        enableResizing: false,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Institution Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
          </span>
        ),
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: "updatedAt",
        id: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Updated"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {format(new Date(row.original.updatedAt), "MMM dd, yyyy")}
          </span>
        ),
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="w-full flex justify-end">
            <ActionsCell row={row} onSuccess={fetchInstitutions} />
          </div>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [fetchInstitutions],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalRecords / pageSize),
    getRowId: (row: Institution) => row.id,
    state: {
      pagination: { pageIndex, pageSize },
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <DataGrid
      table={table}
      recordCount={totalRecords}
      tableLayout={{
        columnsPinnable: true,
        columnsResizable: true,
        columnsMovable: true,
        columnsVisibility: true,
      }}
    >
      <Card className="w-full gap-3 py-0">
        <CardHeader className="flex items-center justify-between px-3.5 py-2">
          <div className="flex items-center justify-between w-full gap-2.5">
            <InputGroup className="w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="w-4 h-4" />
              </InputGroupAddon>

              <InputGroupInput
                className="pl-9"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery.length > 0 && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Clear"
                    title="Clear"
                    size="icon-xs"
                    onClick={() => setSearchQuery("")}
                  >
                    <XIcon className="w-4 h-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <AddInstitutionDialog onSuccess={fetchInstitutions} />
          </div>
        </CardHeader>
        <CardContent className="border-y px-0">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </CardContent>
        <CardFooter className="border-none bg-transparent! px-3.5 py-2">
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
