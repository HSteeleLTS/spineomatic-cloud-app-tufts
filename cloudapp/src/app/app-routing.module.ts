import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent, CanDeactivateConfiguration, CanActivateConfiguration } from './configuration/configuration.component';
import { LabelsComponent } from './labels/labels.component';
import { MainComponent } from './main/main.component';
import { PrintComponent } from './print/print.component';
import { ModalComponent } from './modal/modal.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'configuration', component: ConfigurationComponent, canDeactivate: [CanDeactivateConfiguration], canActivate: [CanActivateConfiguration]},
  { path: 'labels', component: LabelsComponent },
  { path: 'print', component: PrintComponent },
  { path: 'modal', component: ModalComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
