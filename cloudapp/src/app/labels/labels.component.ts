import { Input, Component, ComponentFactoryResolver, ComponentRef, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Config, Layout } from '../models/configuration';
import { ConfigService } from '../services/config.service';
import { PrintService } from '../services/print.service';
import { snakeCase, startCase, isEqual } from 'lodash';
import { AlertService, CloudAppStoreService } from '@exlibris/exl-cloudapp-angular-lib';
import { PrintComponent } from '../print/print.component';
import { finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';
import { DialogService, PromptDialogData } from 'eca-components';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { htmlToText } from 'html2text'; 
import { parse } from 'node-html-parser';
import { NgbModal, NgbActiveModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modal/modal.component';



const LABELS_STICKY = "labelsSticky";
const dialogData: PromptDialogData = {
  title: 'Labels.Dialog.title',
  text: 'Labels.Dialog.text',
  cancel: 'Labels.Dialog.cancel',
  ok: 'Labels.Dialog.ok',
}

@Component({
  selector: 'app-labels',
  templateUrl: './labels.component.html',
  styleUrls: ['./labels.component.scss']
})
export class LabelsComponent implements OnInit {
  labels1 = "";
  config: Config;
  startCase = startCase;
  @ViewChild('iframe', { read: ElementRef }) iframe: ElementRef;
  loading = false;
  isEqual = isEqual;
  printComponent: ComponentRef<PrintComponent>;
  modalComponent: ComponentRef<ModalComponent>;
  layoutControl = new FormControl();
  filteredLayouts: Observable<string[]>;
  templateControl = new FormControl();
  filteredTemplates: Observable<string[]>;
  dataPassToChild: any = null;

  constructor(
    

	private modalService: NgbModal,
    public printService: PrintService,
    private configService: ConfigService,
    private resolver: ComponentFactoryResolver,
    private vcref: ViewContainerRef,
    private alert: AlertService,   
    private store: CloudAppStoreService, 
    private dialog: DialogService,
    private router: Router,
  ) { }

  ngOnInit() {
    const componentFactory = this.resolver.resolveComponentFactory(PrintComponent);
    this.printComponent = this.vcref.createComponent(componentFactory);
    this.configService.get()
    .pipe(
      tap(config => this.config = config),
      switchMap(() => this.store.get(LABELS_STICKY)),
      tap(sticky => {
        if (sticky) {
          if (sticky.template) {
            this.printService.template = this.config.templates[sticky.template];
            this.templateControl.setValue(sticky.template);
          }
          if (sticky.layout) {
            this.printService.layout = this.config.layouts[sticky.layout];
            this.layoutControl.setValue(sticky.layout);
          }
          if (sticky.marginless) {
            this.printService.CIL = sticky.marginless
          }
          if (sticky.gridlines) {
            this.printService.gridlines = sticky.gridlines;
          }
        };
        this.filteredLayouts = this.layoutControl.valueChanges
        .pipe(
          startWith(''),
          map(name => name ? this._filter(name, 'layouts') : Object.keys(this.config.layouts).slice())
        );
        this.filteredTemplates = this.templateControl.valueChanges
        .pipe(
          startWith(''),
          map(name => name ? this._filter(name, 'templates') : Object.keys(this.config.templates).slice())
        );
      }),
    )
    .subscribe();
    this.loadItemsFromSet();
  }

  openChildComponentModal(){

    const modalRef = this.modalService.open(ModalComponent, { size: 'lg',backdrop:false});

    (<ModalComponent>modalRef.componentInstance).labels1 = this.labels1;

    modalRef.result.then((result) => {
      console.log(result);
    }).catch( (result) => {
      console.log(result);
    });
  }
  loadItemsFromSet = () => {
    if (!!this.printService.setId) {
      this.loading = true;
      this.printService.loadItems()
      .subscribe({
        complete: () => this.loading = false
      })
    }
  }
     getPlainText(input_html: string): string {
	  input_html = input_html.replace(/(\d+)mm/g, (match: string, number: string) => {
		return (+number * 3.78).toString() + 'px';
	  });

	  input_html = input_html.replace(/^\<body[^\>]+\>(.+)\<\/body.+$/, '$1');

	  var document_1 = parse(input_html);
	  var row = document_1.getElementsByTagName('td');
	  var spine_label = row[0].text;
	  var pocket_label = row[2].text;
  	  var spine_label_style = row[0].getAttribute('style');
	  var pocket_label_style = row[2].getAttribute('style');

	  var spine_label_width = spine_label_style.match(/width:\s(\d+)/)![1];
	  var pocket_label_width = pocket_label_style.match(/width:\s(\d+)/)![1];

	  const parseWidth = (element_width: string, pixels_per_character: number): string => {
		return (+element_width / pixels_per_character).toString();
	  };

	  spine_label_width = parseWidth(spine_label_width, 8);

	  pocket_label_width = parseWidth(pocket_label_width, 8);

	  const wordWrap = (str: string, max: number, br: string = '<BR>'): string => {
		return str.replace(new RegExp(`(?![^\\n]{1,${max}}$)([^\\n]{1,${max}})\\s`, 'g'), '$1' + br);
	  };
	
	  spine_label = wordWrap(spine_label, parseInt(spine_label_width, 10));
	  pocket_label = wordWrap(pocket_label, parseInt(pocket_label_width, 10)); 
	  //spine_label = spine_label.replace(/\.([A-Za-z])/, '<BR>.$1');
	  //spine_label = spine_label.replace(/^\s*([A-Za-z]+)(\d+)/, '$1<BR>$2');
	  //pocket_label = pocket_label.replace(/\//, '');
      spine_label = "<pre>" + spine_label + "</pre>";
	  pocket_label = "<pre>" + pocket_label + "</pre>";
 	  document_1.getElementsByTagName('td')[0].set_content(spine_label);
	  document_1.getElementsByTagName('td')[2].set_content(pocket_label); 

	  
	  var html_string_updated = document_1.toString();
	  //alert(html_string_updated);
	  html_string_updated = html_string_updated.replace("<tbody>", "");
	  html_string_updated = html_string_updated.replace("</tbody>", "");
	  //html_string_updated =  html_string_updated.replace(/<BR>\s*<BR>/, "<BR>");
      var html_string_updated_1 = "<table class='address'><tr><th align='left'>Invoice Address <br></th><th align='left'>Shipment Address</th></tr><tr><td align='left'><p>Mr.<br>John Doe<br>Featherstone Street 49<br>28199 Bremen<br></p></td><td align='right'><p>Mr.<br>John Doe<br>Featherstone Street 49<br>28199 Bremen<br></p></td></tr></table>"
      //return html_string_updated;

		const options_1 = {
	
			 tables:['.address'],
			 //format: 'dataTable'
//			 colSpacing: 1, maxColumnWidth: 1200, leadingLineBreaks: 0 },
		  }
	
	  //input_html = input_html.replace("\n", "<BR>");
	  //alert(input_html);
	  // html_string_updated = html_string_updated.replace(new RegExp("\<table", "g"), "<table class='label_table'");
	  var return_text = htmlToText(html_string_updated, {tables: true});
	  
	  
	  //return_text =  return_text.replace             (new RegExp("[\n\R]", "g"), "&middot;")
	  
	  return_text = "<pre>" + return_text + "</pre>";
	  //return_text = "<pre>" + return_text + "</pre>";
	  //alert(html_string_updated);


	  return return_text;
  }
  get valid() {
    return !!this.printService.layout && 
      !!this.printService.template &&
      this.printService.items.size > 0 &&
      this.printService.offset >= 0 &&
      this.printService.offset <= this.printService.layout.perPage;
  }

  /*sendLabels () {
	  var x = 0;
	  var labels = []
	  while (this.printComponent.instance.items[x]) {
		var contents = this.printComponent.instance.contents(this.printComponent.instance.items[x][0]);
		var outputHTML = this.getPlainText(contents);
		//this.alert.info(outputHTML);
		labels[x] = outputHTML;

		x = x + 1;
		
		
    }	
	
	this.labels1 = labels;
  }*/
  print() {
    const doc = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
    // CIL change: margin of 0px on html body to prevent default 8px margins
    const CIL_style = "<style>@media print {html, body {margin: 0px;} }</style>";
    doc.body.innerHTML = this.printService.CIL ? CIL_style : "";
    doc.body.appendChild(this.printComponent.location.nativeElement);
	var doc1 = "<div><p>test test1</p></div>";
    this.loading = true;
	
	
    var x = 0;
 	this.printComponent.instance.load()
	.pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => setTimeout(this.printIt),
	  //next: (doc) => console.log('Observer got a next value: ' + x),
      error: e => this.alert.error('An error occurred: ' + e.message),
    }); 
	
	

	
    
  }

  get percentComplete() {
    return !!this.printComponent ? this.printComponent.instance.percentLoaded : 0;
  }

   printIt = () => {
    
	var x = 0;
	var labels = [];
	while (this.printComponent.instance.items[x]) {
		var contents = this.printComponent.instance.contents(this.printComponent.instance.items[x][0]);
		var outputHTML = this.getPlainText(contents);
		//this.alert.info(outputHTML);
		var printWindow = window.open();
		printWindow.focus();
		printWindow.document.open('text/plain');
		printWindow.document.write(outputHTML);

		labels[x] = outputHTML;

		x = x + 1;
    }	
	

	//this.alert.info(labels[0]);

	
    var aggregated_output_html = "";
	for (var label of labels) {
	
	    this.alert.info(label);
	//	//outputHTML = this.getPlainText(label);
		aggregated_output_html = aggregated_output_html + label;
		
	}
	//var outputHTML = this.getPlainText(contents);
	
	//var outputHTML1 = this.getPlainText(contents1);
	
	//var total_html = outputHTML + outputHTML1;
	//this.alert.info(outputHTML);
	//console.log(outputHTML);
	this.labels1 = aggregated_output_html;
    var printWindow = window.open();
	printWindow.focus();
    printWindow.document.open('text/plain');
    printWindow.document.write(aggregated_output_html);
	printWindow.print()
    printWindow.document.close();  
	 /* printWindow.print();*/
	printWindow.close();
	//this.iframe.nativeElement.contentWindow.document.write(outputHTML);
	//this.iframe.nativeElement.contentWindow.innerHTML = outputHTML;
	//this.iframe.nativeElement.contentWindow.print()
    this.dialog.confirm(dialogData)
    .subscribe(result => {
      if (!result) return;
      this.printService.clear()
      .then(() => this.router.navigate(['/']));
    });
  }

  onSelected(event: MatAutocompleteSelectedEvent, type: string) {
    const name = event.option.value;
    this.printService[type] = this.config[type + 's'][name];
    this.storeSticky(name, type);
  }

  storeSticky(val: string, prop: string) {
    this.store.get(LABELS_STICKY).pipe(
      map(sticky=>Object.assign(sticky || {}, { [prop]: snakeCase(val) })),
      switchMap(sticky=>this.store.set(LABELS_STICKY, sticky))
    )
    .subscribe();
  }

  //onChange(event: MatSlideToggleChange, prop: string, val: string) {
  onChange(prop: string, val: boolean) {
    this.store.get(LABELS_STICKY).pipe(
      map(sticky=>Object.assign(sticky || {}, { [prop]: val })),
      switchMap(sticky=>this.store.set(LABELS_STICKY, sticky))
    )
    .subscribe();
  }

  private _filter(name: string, obj: string): string[] {
    return Object.keys(this.config[obj]).filter(key => startCase(key).toLowerCase().includes(name.toLowerCase()));
  }
}
