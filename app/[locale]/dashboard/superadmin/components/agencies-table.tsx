"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  PaginationState,
  SortingState,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
} from "@tanstack/react-table";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { format } from "date-fns";
import { MoreHorizontalIcon, SearchIcon, XIcon } from "lucide-react";
import { AddAgencyDialog } from "./add-agency-dialog";
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
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Agency {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AgenciesTableProps {
  initialPage?: number;
  initialLimit?: number;
}

function ActionsCell({ row }: { row: Row<Agency> }) {
  const { copyToClipboard } = useCopyToClipboard();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "id";

  const handleCopyId = () => {
    copyToClipboard(row.original.id);
  };

  const handleManage = () => {
    router.push(`/${locale}/dashboard/admin/agencies/${row.original.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size="icon" variant="ghost">
          <MoreHorizontalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuItem onClick={handleManage}>
          Manage Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Placeholder for future Delete Action if needed */}
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => e.preventDefault()}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AgenciesTable({
  initialPage = 1,
  initialLimit = 10,
}: AgenciesTableProps) {
  const [data, setData] = useState<Agency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: initialPage - 1,
    pageSize: initialLimit,
  });

  const fetchAgencies = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/agencies?${params}`);
      if (!response.ok) throw new Error("Failed to fetch agencies");

      const result = await response.json();
      // Adjust according to your API's actual response structure
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching agencies:", error);
    }
  }, [pageIndex, pageSize, searchQuery]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const columns = useMemo<ColumnDef<Agency>[]>(
    () => [
      {
        id: "id",
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
            title="Agency Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const params = useParams();
          const locale = params?.locale || "id";

          return (
            <Link
              href={`/${locale}/dashboard/admin/agencies/${row.original.id}`}
              className="text-foreground font-medium hover:underline flex items-center gap-1.5 w-fit"
            >
              {row.original.name}
            </Link>
          );
        },
        size: 250,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created Date"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          if (!row.original.createdAt) return null;
          return (
            <div className="text-foreground font-medium">
              {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="w-full flex justify-end">
            <ActionsCell row={row} />
          </div>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil((data?.length || 0) / pageSize),
    getRowId: (row: Agency) => row.id,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={data?.length || 0}
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
                placeholder="Search agencies..."
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
            <AddAgencyDialog onSuccess={fetchAgencies} />
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
