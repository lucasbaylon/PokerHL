import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent implements OnInit {

  constructor(
    private router: Router,
    private apiSituation: SituationService,
    private apiCommon: CommonService
  ) { }

  ngOnInit(): void {
  }

  redirectTo(page: string) {
    this.router.navigate([page]);
  }

}
