// Decorators and Lifehooks
import { Component, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

// Router
import { Router } from '@angular/router';

// Forms
import { FormControl, FormGroup, Validators } from '@angular/forms';

// RXJS
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Services
import { CartService } from '../../services/cart.service';
import { HelperService } from '../../services/helper.service';
import { BsModalService } from 'ngx-bootstrap/modal';

// Models
import { Cart } from '../../models/cart.model';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart;
  cartForm: FormGroup;
  changesSub$: Subscription;
  removeModalRef: BsModalRef;
  lastCartState: string;
  lastDeleteId: string;
  paymentHandler:any = null;
  cartbooks: any[];

  constructor(
    private router: Router,
    private cartService: CartService,
    private helperService: HelperService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.invokeStripe();
    this.cartService
      .getCart()
      .subscribe((res) => {
        this.cart = res.data;
        this.cartForm = this.toFormGroup(this.cart.books);
        this.onChanges();
      });
  }

  ngOnDestroy(): void {
    this.changesSub$.unsubscribe();
  }

  toFormGroup(books: Book[]): FormGroup {
    const group: any = {};

    books.forEach(book => {
      group[book._id] = new FormControl(
        book.qty || '', [
          Validators.required,
          Validators.min(1),
          Validators.max(20)
        ]);
    });

    return new FormGroup(group);
  }

  onChanges(): void {
    this.changesSub$ = this.cartForm
      .valueChanges
      .pipe(
        debounceTime(800),
        distinctUntilChanged()
      )
      .subscribe(val => {
        if (this.lastCartState !== JSON.stringify(val)) {
          this.lastCartState = JSON.stringify(val);
          this.reCalcSum(val);
        }
      });
  }

  openRemoveModal(template: TemplateRef<any>, id: string): void {
    this.lastDeleteId = id;
    this.removeModalRef = this.modalService.show(
      template,
      { class: 'myModal modal-sm' }
    );
  }

  onRemove(): void {
    this.cartService
      .removeFromCart(this.lastDeleteId)
      .subscribe(() => {
        this.helperService.cartStatus.next('remove');
        this.cart.books = this.cart.books.filter(b => b._id !== this.lastDeleteId);
        this.reCalcSum(this.cartForm.value);
        this.removeModalRef.hide();
      });
  }
  emptyCart(){
          this.cartService
        .removeFromCart(this.lastDeleteId)
  }

  onSubmit(): void {
    this.cartService
      .checkout(this.cartForm.value)
      .subscribe(() => {
        this.helperService.cartStatus.next('updateStatus');
        this.router.navigate(['/home']);
      });
  }

  reCalcSum(formValues: object): void {
    let price = 0;
    for (const b of this.cart.books) {
      price += b.price * formValues[b._id];
    }

    this.cart.totalPrice = price;
  }




  getControl(id: string) {
    return this.cartForm.get(id);
  }
  initializePayment(amount: number) {
    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: 'pk_test_51KQ3bNSE51CUW2I3wMOsrLPYvnmJU4lfRiS0i3pIornRRda26nRyeRKc8NMgO6zRVlNLhwBlbYG8kuZnK4pCBaLv004GGMbCIL',
      locale: 'auto',
      token: function (stripeToken: any) {
        console.log({stripeToken})

      }
    });


    paymentHandler.open({
      name: 'Baby-Care',
      description: 'Buying the product',
      amount: amount * 100
    });
  }

    invokeStripe() {
      if(!window.document.getElementById('stripe-script')) {
        const script = window.document.createElement("script");
        script.id = "stripe-script";
        script.type = "text/javascript";
        script.src = "https://checkout.stripe.com/checkout.js";
        script.onload = () => {
          this.paymentHandler = (<any>window).StripeCheckout.configure({
            key: 'pk_test_51KQ3bNSE51CUW2I3wMOsrLPYvnmJU4lfRiS0i3pIornRRda26nRyeRKc8NMgO6zRVlNLhwBlbYG8kuZnK4pCBaLv004GGMbCIL',
            locale: 'auto',
            token: function (stripeToken: any) {
              console.log(stripeToken);


            }
          });
        }
        window.document.body.appendChild(script);
      }
    }
}
function emptycart() {
  throw new Error('Function not implemented.');
}

