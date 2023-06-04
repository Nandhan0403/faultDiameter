import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as XLSX from 'xlsx';
export interface node {
  nodeID: number;
  connections: number[] | undefined;
}
export interface HTMLInputEvent extends Event {
  target: HTMLInputElement | null | undefined | any;
  // target: HTMLInputElement & EventTarget;
}

export interface product {
  id: number;
  name: string;
  brand: string;
  color: string;
  price: number;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  displayedColumns: string[] = ['name', 'weight'];
  data: product[] = [];
  graphJSON: any[] = [];
  validPaths: any[] = [];
  faultDiameter = '';
  pathNumber: number = 1;
  nodeToRemove = 10;
  shortestPaths: any[] = [];
  nodes: number[] = [];
  pairs: any[] = [];

  @ViewChild('nodesToRemove') private nodesToRemove: ElementRef =
    new ElementRef(Input);

  ngOnInit() {
    // let p1 = 1,
    //   p2 = 22;
    // let point1 = this.graphJSON.find((d) => d.nodeId == p1);
    // //this.traverse(point1, [], p2);
  }

  removeNodes() {
    let nodes: number[] = this.nodesToRemove.nativeElement.value.split(',');
    this.nodes = [];
    this.validPaths = [];
    this.shortestPaths = [];
    this.faultDiameter = '';
    nodes.forEach((e: any) => {
      this.removeNodeandConnections(Number(e));
    });
  }

  exportExcel() {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('ProductSheet');

    worksheet.columns = [
      {
        header: 'nodeID',
        key: 'nodeID',
        width: 10,
        style: { font: { name: 'Arial Black', size: 10 } },
      },
      {
        header: 'connections',
        key: 'connections',
        width: 32,
        style: { font: { name: 'Arial Black', size: 10 } },
      },
    ];

    this.data.forEach((e) => {
      worksheet.addRow(
        {
          id: e.id,
          name: e.name,
          brand: e.brand,
          color: e.color,
          price: e.price,
        },
        'n'
      );
    });

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, 'nodeConnections.xlsx');
    });
  }

  onFileSelect(e?: HTMLInputEvent) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>e?.target;
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    reader.onload = (e: any) => {
      /* create workbook */
      const binarystr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });

      /* selected the first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      let data = XLSX.utils.sheet_to_json(ws); // to get 2d array pass 2nd parameter as object {header: 1}
      data = data as node[];
      let graphJSON: any = [];
      data.forEach((d) => {
        let node = {
          nodeID: (d as node).nodeID,
          connections: (d as node).connections
            ?.toString()
            .split(',')
            .map(Number),
        };
        graphJSON.push(node);
      });
      this.graphJSON = graphJSON;
      
    this.nodes = [];
    this.validPaths = [];
    this.shortestPaths = [];
    this.faultDiameter = '';
    };
  }

  initiatePrep() {
    // Logic to push nodes into an array
    this.graphJSON.forEach((e) => {
      this.nodes.push(e.nodeID);
    });

    // Function call to create pairs of nodes to calculate diameter
    this.pairs = this.generatePairs(this.nodes);

    // Function call to loop through the pairs of nodes and find the fault diameter
    this.loopPairs(this.pairs);
  }

  // Function to loop through the pairs of nodes and find the fault diameter
  loopPairs(pairs: any[]) {
    pairs.forEach((e) => {
      this.validPaths = [];
      let p1 = e[0];
      let p2 = e[1];
      let point1 = this.graphJSON.find((d) => d.nodeID == p1);
      this.traverse(point1, [], p2);
      if (this.validPaths.length) {
        let shortestPath =
          this.validPaths.length === 1
            ? this.validPaths[0]
            : this.validPaths?.reduce((prev, next) =>
                prev.length > next.length ? next : prev
              );
        this.shortestPaths.push(shortestPath);
      }
    });
    this.faultDiameter = this.shortestPaths?.reduce((prev, next) =>
      prev.length < next.length ? next : prev
    );
  }

  // Function to clone an array
  clone(A: any) {
    return JSON.parse(JSON.stringify(A));
  }

  // Function to remove a node and connections
  removeNodeandConnections(nodeToRemove: any) {
    this.graphJSON = this.graphJSON.filter(
      (item) => item.nodeID !== nodeToRemove
    );
    this.graphJSON.forEach((e) => {
      e.connections = e.connections.filter(
        (item: any) => item !== nodeToRemove
      );
    });
  }

  // Function to generate pairs of nodes
  generatePairs(n: any) {
    let pairs: any = [];
    n.flatMap((v: any, i: any) =>
      n.slice(i + 1).map((w: any) => {
        pairs.push([v, w]);
      })
    );
    return pairs;
  }

  // Function to traverse through the graph Json and find out all the valid paths between two nodes
  traverse(point1: any, path: any, p2: any) {
    path.push(point1.nodeID);
    if (point1.nodeID === p2) {
      this.validPaths.push(this.clone(path));
      return;
    }
    point1.connections.forEach((x: any) => {
      if (path.indexOf(x) === -1) {
        var newPath = this.clone(path);
        point1 = this.graphJSON.find((d: any) => d.nodeID == x);
        this.traverse(point1, newPath, p2);
      }
    });
  }
}
