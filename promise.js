/**
 * Promise A+
 */

function Promise(executor) {
	this.status = "pending"; // fulfilled rejected
	this.value = null;
	this.reason = null;
	this.onfulfilledArr = [];
	this.onrejectedArr = [];

	const resolve = (value) => {
		if (value instanceof Promise) {
			return value.then(resolve, reject);
		}

		setTimeout(() => {
			if (this.status === "pending") {
				this.value = value;
				this.status = "fulfilled";
				this.onfulfilledArr.map((func) => func(this.value));
			}
		});
	};

	const reject = (reason) => {
		setTimeout(() => {
			if (this.status === "pending") {
				this.reason = reason;
				this.status = "rejected";
				this.onrejectedArr.map((func) => func(this.reason));
			}
		});
	};

	try {
		executor(resolve, reject);
	} catch (error) {
		reject(error);
	}
}

function resolvePromise(promise2, x, resolve, reject) {
	// 如果 promise 和 x 是相同的, 则以 promise 的 TypeError 报错
	if (promise2 === x)
		reject(new TypeError("error due to circular reference"));

	// 如果 x 是一个 promise 对象, 则使 promise 接受 x 的状态
	if (x instanceof Promise) {
		// 如果 x 处于等待状态， promise 需保持为等待态直至 x 被执行或拒绝
		if (x.status === "pending") {
			x.then(function (data) {
				resolvePromise(promise2, data, resolve, reject);
			}, reject);
		} else {
			// 如果 x 处于执行态，用相同的值执行 promise
			// 如果 x 处于拒绝态，用相同的据因拒绝 promise
			x.then(resolve, reject);
		}

		return;
	}

	// 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
	let consumed = false;
	let thenable;

	const isComplex = (target) =>
		target !== null &&
		(typeof target === "function" || typeof target === "object");

	// x 是对象或者函数时
	if (isComplex(x)) {
		try {
			// 把 x.then 赋值给 thenable 方法
			thenable = x.then;
			// 如果 thenable 是函数，则将 x 作为函数的作用域的 this 被绑定并调用。传递两个回调函数作为参数，第一个参数叫做resolvePromise，第二个参数叫做 rejectPromise
			if (typeof thenable === "function") {
				thenable.call(
					x,
					function (y) {
						// 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
						if (consumed) return;

						consumed = true;
						return resolvePromise(promise2, y, resolve, reject);
					},
					function (r) {
						// 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
						if (consumed) return;

						consumed = true;
						return reject(r);
					}
				);
			} else {
				// 如果 then 不是函数，以 x 为参数执行 promise
				resolve(x);
			}
		} catch (error) {
			if (consumed) return;

			consumed = true;
			return reject(error);
		}
	} else {
		// 如果 x 不是对象或者函数，以 x 为参数执行 promise
		resolve(x);
	}
}

Promise.prototype.then = function (onfulfilled, onrejected) {
	onfulfilled =
		typeof onfulfilled === "function" ? onfulfilled : (data) => data;
	onrejected =
		typeof onrejected === "function"
			? onrejected
			: (err) => {
					throw err;
			  };
	let promise2;

	if (this.status === "pending") {
		promise2 = new Promise((resolve, reject) => {
			this.onfulfilledArr.push((value) => {
				try {
					let x = onfulfilled(value);
					resolvePromise(promise2, x, resolve, reject);
				} catch (error) {
					reject(error);
				}
			});

			this.onrejectedArr.push((reason) => {
				try {
					let x = onrejected(reason);
					resolvePromise(promise2, x, resolve, reject);
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	if (this.status === "fulfilled") {
		promise2 = new Promise((resolve, reject) => {
			try {
				let x = onfulfilled(this.value);
				resolvePromise(promise2, x, resolve, reject);
			} catch (error) {
				reject(error);
			}
		});
	}

	if (this.status === "rejected") {
		promise2 = new Promise(function (resolve, reject) {
			try {
				let x = onrejected(this.reason);
				resolvePromise(promise2, x, resolve, reject);
			} catch (error) {
				reject(error);
			}
		});
	}
	return promise2;
};

Promise.prototype.catch = function (catchFn) {
	return this.then(null, catchFn);
};

Promise.resolve = function (value) {
	return new Promise((resolve, reject) => resolve(value));
};

Promise.reject = function (reason) {
	return new Promise((resolve, reject) => reject(reason));
};

Promise.all = function (promsieArr) {
	if (!Array.isArray(promsieArr)) {
		throw new TypeError("The arguments should be an array!");
	}

	return new Promise((resolve, reject) => {
		try {
			let resultArr = [];
			const len = promsieArr.length;

			promsieArr.map((p) => {
				p.then((data) => {
					resultArr.push(data);
					if (resultArr.length === len) {
						resolve(resultArr);
					}
				}, reject);
			});
		} catch (error) {
			reject(error);
		}
	});
};

Promise.race = function (promiseArr) {
	if (!Array.isArray(promsieArr)) {
		throw new TypeError("The arguments should be an array!");
	}

	return new Promise((resolve, reject) => {
		try {
			promiseArr.map((p) => p.then(resolve, reject));
		} catch (error) {
			reject(error);
		}
	});
};

module.exports = Promise;
