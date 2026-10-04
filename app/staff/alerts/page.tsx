"use client";

import Link from "next/link";
import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaterials } from "@/lib/materials-store";

export default function LowStockAlertsPage() {
  const materials = useMaterials();
  const lowStock = materials.filter((material) => material.quantity <= material.minimumStock);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" />Low Stock Alerts</CardTitle>
        <CardDescription>Materials at or below their configured minimum stock level.</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStock.length === 0 ? <div className="flex flex-col items-center gap-2 py-10 text-center"><Package className="size-8 text-muted-foreground" /><p className="font-medium">No low stock materials</p><p className="text-sm text-muted-foreground">Inventory is above the minimum stock levels.</p></div> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>SKU</TableHead><TableHead>Available</TableHead><TableHead>Minimum</TableHead><TableHead>Alert</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{lowStock.map((material) => <TableRow key={material.id}>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>{material.sku}</TableCell>
                <TableCell>{material.quantity} {material.unit}</TableCell>
                <TableCell>{material.minimumStock} {material.unit}</TableCell>
                <TableCell><Badge variant={material.quantity <= 0 ? "destructive" : "outline"}>{material.quantity <= 0 ? "Out of stock" : "Reorder"}</Badge></TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" render={<Link href={`/staff/stock-in?sku=${encodeURIComponent(material.sku)}`}>Receive stock</Link>} /><Button size="sm" render={<Link href={`/staff/purchase-orders?materialId=${encodeURIComponent(material.id)}`}>Create purchase order</Link>} /></div></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
