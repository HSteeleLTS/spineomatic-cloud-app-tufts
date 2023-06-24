import { Component, ComponentFactoryResolver, ComponentRef, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
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
  config: Config;
  startCase = startCase;
  @ViewChild('iframe', { read: ElementRef }) iframe: ElementRef;
  loading = false;
  isEqual = isEqual;
  printComponent: ComponentRef<PrintComponent>;
  layoutControl = new FormControl();
  filteredLayouts: Observable<string[]>;
  templateControl = new FormControl();
  filteredTemplates: Observable<string[]>;

  constructor(
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
	  var call_number = row[0].text;
	  var title = row[2].text;
	  var call_number_style = row[0].getAttribute('style');
	  var title_style = row[2].getAttribute('style');

	  var call_number_width = call_number_style.match(/width:\s(\d+)/)![1];
	  var title_width = title_style.match(/width:\s(\d+)/)![1];

	  const parseWidth = (element_width: string, pixels_per_character: number): string => {
		return (+element_width / pixels_per_character).toString();
	  };

	  call_number_width = parseWidth(call_number_width, 8);

	  title_width = parseWidth(title_width, 8);

	  const wordWrap = (str: string, max: number, br: string = '<BR>'): string => {
		return str.replace(new RegExp(`(?![^\\n]{1,${max}}$)([^\\n]{1,${max}})\\s`, 'g'), '$1' + br);
	  };

	  call_number = wordWrap(call_number, parseInt(call_number_width, 10));
	  title = wordWrap(title, parseInt(title_width, 10));

      call_number = "<pre>" + call_number + "</pre>";
	  title = "<pre>" + title + "</pre>";
	  document_1.getElementsByTagName('td')[0].set_content(call_number);
	  document_1.getElementsByTagName('td')[2].set_content(title);

	  var html_string_updated = document_1.toString();
	  //alert(html_string_updated);
	  html_string_updated = html_string_updated.replace("<tbody>", "");
	  html_string_updated = html_string_updated.replace("</tbody>", "");

      var html_string_updated_1 = "<table class='address'><tr><th align='left'>Invoice Address <br></th><th align='left'>Shipment Address</th></tr><tr><td align='left'><p>Mr.<br>John Doe<br>Featherstone Street 49<br>28199 Bremen<br></p></td><td align='right'><p>Mr.<br>John Doe<br>Featherstone Street 49<br>28199 Bremen<br></p></td></tr></table>"
      //return html_string_updated;

		const options_1 = {
	
			 tables:['.address'],
			 //format: 'dataTable'
//			 colSpacing: 1, maxColumnWidth: 1200, leadingLineBreaks: 0 },
		  }
	
	
	  html_string_updated = html_string_updated.replace(new RegExp("\<table", "g"), "<table class='label_table'");
	  var return_text = htmlToText(html_string_updated, {tables:['.label_table']});
	  
	  
	  //return_text =  return_text.replace             (new RegExp("[\n\R]", "g"), "&middot;")
	  
	  return_text = "<pre>" + return_text + "</pre>";
	  //return_text = "<pre>" + return_text + "</pre>";
	  alert(return_text);


	  return return_text;
  }
  get valid() {
    return !!this.printService.layout && 
      !!this.printService.template &&
      this.printService.items.size > 0 &&
      this.printService.offset >= 0 &&
      this.printService.offset <= this.printService.layout.perPage;
  }

  print() {
    const doc = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
    // CIL change: margin of 0px on html body to prevent default 8px margins
    const CIL_style = "<style>@media print {html, body {margin: 0px;} }</style>";
    doc.body.innerHTML = this.printService.CIL ? CIL_style : "";
    doc.body.appendChild(this.printComponent.location.nativeElement);
	var doc1 = "<div><p>test test1</p></div>";
    this.loading = true;
	
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
    
	var contents = this.printComponent.instance.contents(this.printComponent.instance.items[0][0]);
	contents = contents.toString();

	//this.iframe.nativeElement.contentWindow.print();
	//const doc = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
    // CIL change: margin of 0px on html body to prevent default 8px margins
    //const CIL_style = "<style>@media print {html, body {margin: 0px;} }</style>";
    //doc.body.innerHTML = this.printService.CIL ? CIL_style : "";
    //doc.body.appendChild(this.printComponent.location.nativeElement);
	var outputHTML = this.getPlainText(contents);
	//this.alert.info(outputHTML);
	//console.log(outputHTML);
    var printWindow = window.open();
	printWindow.focus();
    printWindow.document.open('text/plain');
    printWindow.document.write(outputHTML);
    printWindow.document.close(); 
	 /* printWindow.print();*/
	//printWindow.close();
	//this.iframe.nativeElement.contentWindow.document.write(outputHTML);
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
